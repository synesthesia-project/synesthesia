import { Reflection as ModelReflection, ReflectionKind } from 'typedoc/dist/lib/models/reflections/abstract';
import { ProjectReflection } from 'typedoc/dist/lib/models/reflections/project';
import { ContainerReflection } from 'typedoc/dist/lib/models/reflections/container';
import { ModelToObject } from 'typedoc/dist/lib/serialization/schema';

export type JsonApi = ModelToObject<ProjectReflection>;
export type Reflection = ModelToObject<ModelReflection>;
export type Container = ModelToObject<ContainerReflection>;

export function isPackage(reflection: Reflection): reflection is Container {
  return reflection.kind === ReflectionKind.Global;
}

export function isExternalModule(reflection: Reflection): reflection is Container {
  return reflection.kind === ReflectionKind.ExternalModule;
}

export function isClass(reflection: Reflection): reflection is Container {
  return reflection.kind === ReflectionKind.Class;
}

export function isInterface(reflection: Reflection): reflection is Container {
  return reflection.kind === ReflectionKind.Interface;
}
