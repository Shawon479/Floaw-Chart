import React from 'react';
import { FlowchartConfig } from '../types';

interface FlowchartCanvasProps {
  config: FlowchartConfig;
  onUpdateBoxText?: (index: number, newText: string) => void;
  onUpdateTitle?: (newTitle: string) => void;
  isInteractive?: boolean;
}

export const FlowchartCanvas: React.FC<FlowchartCanvasProps> = ({
  config,
  onUpdateBoxText,
  onUpdateTitle,
  isInteractive = true,
}) => {
  const { title, boxes, layout, titleStyle, boxStyle, numberStyle, arrowStyle, paperStyle } = config;

  const getNumberPrefix = (index: number) => {
    switch (numberStyle.format) {
      case 'numberDot':
        return `${index + 1}.`;
      case 'parentheses':
        return `(${index + 1})`;
      case 'roman': {
        const romans = ['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)', '(vii)', '(viii)', '(ix)', '(x)'];
        return romans[index] || `(${index + 1})`;
      }
      case 'circle': {
        const circles = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
        return circles[index] || `${index + 1}`;
      }
      case 'step':
        return `Step ${index + 1}:`;
      case 'none':
        return '';
      default:
        return `${index + 1}.`;
    }
  };

  const titleFontClasses = {
    sans: 'font-sans',
    serif: 'font-serif',
    bengali: 'font-sans tracking-wide',
  }[titleStyle.fontFamily];

  const titleSizeClasses = {
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl',
  }[titleStyle.fontSize];

  const boxSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg',
  }[boxStyle.fontSize];

  const paddingClasses = {
    compact: 'py-2 px-3',
    normal: 'py-3 px-4 sm:py-3.5 sm:px-5',
    relaxed: 'py-4 px-6',
  }[boxStyle.padding];

  const isUniform = boxStyle.isUniformHeight ?? true;
  const uniformHeight = boxStyle.uniformHeight || 54;
  const verticalAlignClass = boxStyle.verticalAlign === 'top' ? 'items-start pt-3' : 'items-center';

  const renderVerticalArrow = (key: string | number) => {
    const len = arrowStyle.length;
    const color = arrowStyle.color;
    const th = arrowStyle.thickness;
    const type = arrowStyle.type || 'slim';

    return (
      <div
        key={`arrow-${key}`}
        className="flex justify-center items-center select-none w-full my-0.5"
        style={{ height: `${len}px` }}
      >
        <svg
          width="24"
          height={len}
          viewBox={`0 0 24 ${len}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ shapeRendering: 'geometricPrecision', display: 'block', overflow: 'visible' }}
        >
          {type === 'dashed' ? (
            <>
              <line
                x1="12"
                y1="0"
                x2="12"
                y2={len - 6}
                stroke={color}
                strokeWidth={th}
                strokeDasharray="4 3"
              />
              <path
                d={`M 8 ${len - 7} L 12 ${len - 0.5} L 16 ${len - 7}`}
                stroke={color}
                strokeWidth={th}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </>
          ) : type === 'double' ? (
            <>
              <line
                x1="10"
                y1="0"
                x2="10"
                y2={len - 7}
                stroke={color}
                strokeWidth={th}
              />
              <line
                x1="14"
                y1="0"
                x2="14"
                y2={len - 7}
                stroke={color}
                strokeWidth={th}
              />
              <polygon
                points={`7,${len - 8} 12,${len - 0.5} 17,${len - 8}`}
                fill={color}
              />
            </>
          ) : type === 'triangle' ? (
            <>
              <line
                x1="12"
                y1="0"
                x2="12"
                y2={len - 7}
                stroke={color}
                strokeWidth={th}
              />
              <polygon
                points={`7.5,${len - 8} 12,${len - 0.5} 16.5,${len - 8}`}
                fill={color}
              />
            </>
          ) : type === 'slim' ? (
            /* Exact match with user's screenshot: sharp vertical stem + crisp open V arrowhead */
            <>
              <line
                x1="12"
                y1="0"
                x2="12"
                y2={len - 1}
                stroke={color}
                strokeWidth={th}
                strokeLinecap="square"
              />
              <path
                d={`M 7.5 ${len - 7.5} L 12 ${len - 0.5} L 16.5 ${len - 7.5}`}
                stroke={color}
                strokeWidth={th}
                strokeLinecap="round"
                strokeLinejoin="miter"
                fill="none"
              />
            </>
          ) : (
            /* Classic rounded arrow */
            <>
              <line
                x1="12"
                y1="0"
                x2="12"
                y2={len - 6}
                stroke={color}
                strokeWidth={th}
                strokeLinecap="round"
              />
              <path
                d={`M 7.5 ${len - 7.5} L 12 ${len - 0.5} L 16.5 ${len - 7.5}`}
                stroke={color}
                strokeWidth={th}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </>
          )}
        </svg>
      </div>
    );
  };

  const renderHorizontalArrow = (key: string | number) => {
    const len = arrowStyle.length;
    const color = arrowStyle.color;
    const th = arrowStyle.thickness;
    const type = arrowStyle.type || 'slim';

    return (
      <div
        key={`h-arrow-${key}`}
        className="flex justify-center items-center shrink-0 select-none mx-1"
        style={{ width: `${len}px` }}
      >
        <svg
          width={len}
          height="24"
          viewBox={`0 0 ${len} 24`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ shapeRendering: 'geometricPrecision', display: 'block', overflow: 'visible' }}
        >
          {type === 'triangle' ? (
            <>
              <line
                x1="0"
                y1="12"
                x2={len - 7}
                y2="12"
                stroke={color}
                strokeWidth={th}
              />
              <polygon
                points={`${len - 8},7.5 ${len - 0.5},12 ${len - 8},16.5`}
                fill={color}
              />
            </>
          ) : type === 'slim' ? (
            <>
              <line
                x1="0"
                y1="12"
                x2={len - 1}
                y2="12"
                stroke={color}
                strokeWidth={th}
                strokeLinecap="square"
              />
              <path
                d={`M ${len - 7.5} 7.5 L ${len - 0.5} 12 L ${len - 7.5} 16.5`}
                stroke={color}
                strokeWidth={th}
                strokeLinecap="round"
                strokeLinejoin="miter"
                fill="none"
              />
            </>
          ) : (
            <>
              <line
                x1="0"
                y1="12"
                x2={len - 6}
                y2="12"
                stroke={color}
                strokeWidth={th}
                strokeDasharray={type === 'dashed' ? '4 3' : undefined}
              />
              <path
                d={`M ${len - 7.5} 7.5 L ${len - 0.5} 12 L ${len - 7.5} 16.5`}
                stroke={color}
                strokeWidth={th}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </>
          )}
        </svg>
      </div>
    );
  };

  return (
    <div
      id="flowchart-canvas"
      className="print-area w-full mx-auto transition-all duration-200 select-text"
      style={{
        backgroundColor: paperStyle.background,
        padding: `${paperStyle.pagePadding}px`,
        maxWidth: layout === 'horizontal' ? '100%' : '820px',
        minHeight: '800px',
      }}
    >
      {/* Optional Board Exam Header (Formal HSC Script Style) */}
      {paperStyle.showBoardHeader && (
        <div className="mb-6 pb-4 border-b border-gray-300 text-center text-xs sm:text-sm text-gray-700 font-serif">
          <div className="font-bold tracking-wider uppercase text-gray-900">
            {paperStyle.boardHeaderText || 'HSC Examination — English 1st Paper'}
          </div>
          <div className="italic text-gray-600 mt-0.5">
            {paperStyle.questionNumberText || 'Ans. to the Q. No. 2'}
          </div>
        </div>
      )}

      {/* Main Flowchart Title / Heading */}
      <div
        className={`mb-6 sm:mb-8 ${titleStyle.align === 'center' ? 'text-center' : 'text-left'}`}
      >
        {isInteractive ? (
          <div
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="sentences"
            data-gramm="false"
            data-enable-grammarly="false"
            inputMode="text"
            role="textbox"
            onBlur={(e) => onUpdateTitle?.(e.currentTarget.innerText)}
            className={`outline-none focus:ring-2 focus:ring-blue-400 focus:rounded p-1 transition-all inline-block ${titleFontClasses} ${titleSizeClasses} leading-relaxed`}
            style={{
              color: titleStyle.color,
              fontWeight: titleStyle.isBold ? 700 : 400,
              textDecoration: titleStyle.isUnderlined ? 'underline' : 'none',
              textUnderlineOffset: '4px',
            }}
          >
            {title}
          </div>
        ) : (
          <h2
            className={`inline-block ${titleFontClasses} ${titleSizeClasses} leading-relaxed`}
            style={{
              color: titleStyle.color,
              fontWeight: titleStyle.isBold ? 700 : 400,
              textDecoration: titleStyle.isUnderlined ? 'underline' : 'none',
              textUnderlineOffset: '4px',
            }}
          >
            {title}
          </h2>
        )}
      </div>

      {/* Flowchart Boxes Container */}
      {layout === 'vertical' && (
        <div className="flex flex-col items-stretch w-full">
          {boxes.map((boxText, index) => {
            const prefix = getNumberPrefix(index);
            const isLast = index === boxes.length - 1;

            const capitalizedText = boxText
              ? boxText.charAt(0).toUpperCase() + boxText.slice(1)
              : '';

            return (
              <React.Fragment key={index}>
                <div
                  className={`w-full relative transition-all duration-150 ${paddingClasses} ${boxSizeClasses} flex ${verticalAlignClass} gap-1.5 box-border`}
                  style={{
                    border: `${boxStyle.borderWidth}px solid ${boxStyle.borderColor}`,
                    borderRadius: `${boxStyle.borderRadius}px`,
                    backgroundColor: boxStyle.backgroundColor,
                    color: boxStyle.textColor,
                    minHeight: `${isUniform ? uniformHeight : boxStyle.minHeight}px`,
                    justifyContent: boxStyle.textAlign === 'center' ? 'center' : 'flex-start',
                    boxSizing: 'border-box',
                    wordBreak: 'break-word',
                  }}
                >
                  {prefix && (
                    <span
                      className="shrink-0 select-none mr-0.5"
                      style={{
                        color: numberStyle.color,
                        fontWeight: numberStyle.isBold ? 700 : 500,
                      }}
                    >
                      {prefix}
                    </span>
                  )}
                  {isInteractive ? (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      spellCheck={false}
                      autoCorrect="off"
                      autoCapitalize="sentences"
                      data-gramm="false"
                      data-enable-grammarly="false"
                      inputMode="text"
                      role="textbox"
                      onBlur={(e) => {
                        const raw = e.currentTarget.innerText;
                        const cap = raw.trim() ? raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1) : raw;
                        onUpdateBoxText?.(index, cap);
                      }}
                      className="w-full outline-none focus:bg-blue-50/50 rounded px-0.5 transition-colors leading-snug break-words"
                    >
                      {capitalizedText}
                    </div>
                  ) : (
                    <span className="w-full leading-snug break-words">{capitalizedText}</span>
                  )}
                </div>

                {!isLast && renderVerticalArrow(index)}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Horizontal Chain Layout */}
      {layout === 'horizontal' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex items-center min-w-max py-2">
            {boxes.map((boxText, index) => {
              const prefix = getNumberPrefix(index);
              const isLast = index === boxes.length - 1;

              return (
                <React.Fragment key={index}>
                  <div
                    className={`w-52 sm:w-60 relative transition-all duration-150 ${paddingClasses} ${boxSizeClasses} flex flex-col`}
                    style={{
                      border: `${boxStyle.borderWidth}px solid ${boxStyle.borderColor}`,
                      borderRadius: `${boxStyle.borderRadius}px`,
                      backgroundColor: boxStyle.backgroundColor,
                      color: boxStyle.textColor,
                      minHeight: `${isUniform ? Math.max(uniformHeight + 15, 68) : boxStyle.minHeight + 20}px`,
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                      wordBreak: 'break-word',
                    }}
                  >
                    {prefix && (
                      <span
                        className="mb-1 select-none text-xs sm:text-sm"
                        style={{
                          color: numberStyle.color,
                          fontWeight: numberStyle.isBold ? 700 : 500,
                        }}
                      >
                        {prefix}
                      </span>
                    )}
                    {isInteractive ? (
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="sentences"
                        data-gramm="false"
                        data-enable-grammarly="false"
                        inputMode="text"
                        role="textbox"
                        onBlur={(e) => onUpdateBoxText?.(index, e.currentTarget.innerText)}
                        className="outline-none focus:bg-blue-50/50 rounded p-1 -m-1 transition-colors leading-snug break-words text-left"
                      >
                        {boxText}
                      </div>
                    ) : (
                      <span className="leading-snug break-words text-left">{boxText}</span>
                    )}
                  </div>

                  {!isLast && renderHorizontalArrow(index)}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* 2-Row Grid Layout (3x2 format with connecting arrow) */}
      {layout === 'grid2' && (
        <div className="flex flex-col gap-3 w-full">
          {/* Row 1 */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 items-center">
            {boxes.slice(0, 3).map((boxText, i) => {
              const index = i;
              const prefix = getNumberPrefix(index);
              return (
                <div
                  key={`r1-${index}`}
                  className={`w-full relative ${paddingClasses} ${boxSizeClasses} flex flex-col justify-center`}
                  style={{
                    border: `${boxStyle.borderWidth}px solid ${boxStyle.borderColor}`,
                    borderRadius: `${boxStyle.borderRadius}px`,
                    backgroundColor: boxStyle.backgroundColor,
                    color: boxStyle.textColor,
                    minHeight: `${isUniform ? Math.max(uniformHeight + 10, 64) : boxStyle.minHeight + 15}px`,
                    boxSizing: 'border-box',
                    wordBreak: 'break-word',
                  }}
                >
                  {prefix && (
                    <span
                      className="mb-1 select-none text-xs sm:text-sm"
                      style={{
                        color: numberStyle.color,
                        fontWeight: numberStyle.isBold ? 700 : 500,
                      }}
                    >
                      {prefix}
                    </span>
                  )}
                  {isInteractive ? (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      spellCheck={false}
                      autoCorrect="off"
                      autoCapitalize="sentences"
                      data-gramm="false"
                      data-enable-grammarly="false"
                      inputMode="text"
                      role="textbox"
                      onBlur={(e) => onUpdateBoxText?.(index, e.currentTarget.innerText)}
                      className="outline-none focus:bg-blue-50/50 rounded p-1 -m-1 transition-colors leading-snug break-words"
                    >
                      {boxText}
                    </div>
                  ) : (
                    <span className="leading-snug break-words">{boxText}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Central Downward Connector */}
          <div className="flex justify-end pr-8 sm:pr-16">
            {renderVerticalArrow('grid-bridge')}
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 items-center">
            {boxes.slice(3, 6).map((boxText, i) => {
              const index = i + 3;
              const prefix = getNumberPrefix(index);
              return (
                <div
                  key={`r2-${index}`}
                  className={`w-full relative ${paddingClasses} ${boxSizeClasses} flex flex-col justify-center`}
                  style={{
                    border: `${boxStyle.borderWidth}px solid ${boxStyle.borderColor}`,
                    borderRadius: `${boxStyle.borderRadius}px`,
                    backgroundColor: boxStyle.backgroundColor,
                    color: boxStyle.textColor,
                    minHeight: `${isUniform ? Math.max(uniformHeight + 10, 64) : boxStyle.minHeight + 15}px`,
                    boxSizing: 'border-box',
                    wordBreak: 'break-word',
                  }}
                >
                  {prefix && (
                    <span
                      className="mb-1 select-none text-xs sm:text-sm"
                      style={{
                        color: numberStyle.color,
                        fontWeight: numberStyle.isBold ? 700 : 500,
                      }}
                    >
                      {prefix}
                    </span>
                  )}
                  {isInteractive ? (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      spellCheck={false}
                      autoCorrect="off"
                      autoCapitalize="sentences"
                      data-gramm="false"
                      data-enable-grammarly="false"
                      inputMode="text"
                      role="textbox"
                      onBlur={(e) => onUpdateBoxText?.(index, e.currentTarget.innerText)}
                      className="outline-none focus:bg-blue-50/50 rounded p-1 -m-1 transition-colors leading-snug break-words"
                    >
                      {boxText}
                    </div>
                  ) : (
                    <span className="leading-snug break-words">{boxText}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
