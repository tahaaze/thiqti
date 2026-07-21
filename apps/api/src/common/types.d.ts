declare module "class-validator" {
  export function IsString(): PropertyDecorator;
  export function IsNumber(options?: any): PropertyDecorator;
  export function IsOptional(): PropertyDecorator;
  export function IsBoolean(): PropertyDecorator;
  export function Min(value: number): PropertyDecorator;
  export function Max(value: number): PropertyDecorator;
}
declare module "class-transformer" {
  export function PartialType(cls: any): any;
}
