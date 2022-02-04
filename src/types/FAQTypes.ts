export interface IFAQ {
  data: IFAQItem[];
}

export interface IFAQItem {
  keywords: string[];
  answer: string;
}
