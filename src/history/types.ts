export interface HistoryEvent {
  type: string;
  createdAt: Date;
  data: { [key: string]: string };
}
