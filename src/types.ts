export type FlowchartLayout = 'vertical' | 'horizontal' | 'grid2';

export type NumberFormat = 'numberDot' | 'parentheses' | 'roman' | 'circle' | 'step' | 'none';

export type FontFamily = 'serif' | 'sans' | 'bengali';

export interface TitleStyle {
  color: string;
  isBold: boolean;
  isUnderlined: boolean;
  fontSize: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  align: 'left' | 'center';
  fontFamily: FontFamily;
}

export interface BoxStyle {
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  backgroundColor: string;
  textColor: string;
  fontSize: 'xs' | 'sm' | 'base' | 'lg';
  padding: 'compact' | 'normal' | 'relaxed';
  textAlign: 'left' | 'center';
  minHeight: number;
  isUniformHeight?: boolean;
  uniformHeight?: number;
  verticalAlign?: 'top' | 'center';
}

export interface NumberStyle {
  format: NumberFormat;
  color: string;
  isBold: boolean;
}

export interface ArrowStyle {
  color: string;
  thickness: number;
  length: number; // in pixels
  type: 'slim' | 'classic' | 'triangle' | 'double' | 'dashed';
  headSize?: number;
}

export interface PaperStyle {
  background: string;
  showBoardHeader: boolean;
  boardHeaderText?: string;
  questionNumberText?: string;
  pagePadding: number;
}

export interface FlowchartConfig {
  title: string;
  boxes: string[];
  layout: FlowchartLayout;
  titleStyle: TitleStyle;
  boxStyle: BoxStyle;
  numberStyle: NumberStyle;
  arrowStyle: ArrowStyle;
  paperStyle: PaperStyle;
}

export interface HscPreset {
  id: string;
  title: string;
  unit: string;
  topic: string;
  config: Partial<FlowchartConfig> & {
    title: string;
    boxes: string[];
  };
}
