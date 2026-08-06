export interface TableColumn<T> {
  label: string;
  icon?: string;
  property: Extract<keyof T, string>;
  type: 'text' | 'number' | 'date' | 'boolean' | 'button';
  visible: boolean;
}
