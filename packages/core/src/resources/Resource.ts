export interface ResourceBase {
  DeletionPolicy?: string;
  DependsOn?: string[];
}

export interface Resource<T extends string = string, Props = any>
  extends ResourceBase {
  Properties: Props;
  Type: T;
}
