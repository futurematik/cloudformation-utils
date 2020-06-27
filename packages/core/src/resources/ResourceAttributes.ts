import { Intrinsics, IntrinsicValue } from '../util/Intrinsics';

export interface ResourceAttributesBase {
  name: string;
  ref: IntrinsicValue;
}

export interface ResourceAttributes<Attribs> extends ResourceAttributesBase {
  out: Attribs;
}

export function makeResourceAttributes<Attribs extends string>(
  name: string,
  attribs: Attribs[],
): ResourceAttributes<Record<Attribs, IntrinsicValue>> {
  const out: any = {};
  for (const key of attribs) {
    Object.defineProperty(out, key, {
      get(): IntrinsicValue {
        return Intrinsics.getAtt(name, key);
      },
    });
  }
  return {
    get name() {
      return name;
    },

    get out() {
      return out;
    },

    get ref() {
      return Intrinsics.ref(name);
    },
  };
}
