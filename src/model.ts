import { ObjectProperty, SourceLocation } from "@babel/types";

export type StyleDetail = {
  rootName: string;
  styles: any;
  location: SourceLocation;
  styleType: 'normal' | 'arrow';
};

type ItemDetail = NonNullable<ObjectProperty>

export type ParsedStyle = {
  rootName: string;
  styles: {
    name: string;
    usage: number;
    details: { item: ItemDetail };
  }[];
  location: SourceLocation;
  styleType: 'normal' | 'arrow';
};