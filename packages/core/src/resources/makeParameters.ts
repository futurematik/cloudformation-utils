import { Parameter } from '../template/Parameter';
import { ParameterAttributes, makeParameter } from './makeParameter';
import {
  TemplateBuilder,
  makeTemplateBuilder,
} from '../template/TemplateBuilder';
import { TemplateItem } from '../template/TemplateItem';

export type ParameterSpec<P extends string> = {
  [K in P]: string | Parameter;
};

export type ParametersOutput<P extends string> = {
  [K in P]: ParameterAttributes;
};

export function makeParameters<P extends string>(
  spec: ParameterSpec<P>,
): [TemplateBuilder, ParametersOutput<P>] {
  const params: TemplateItem[] = [];
  const out = {} as ParametersOutput<P>;

  for (const name in spec) {
    const param: string | Parameter = spec[name];
    let paramProps: Parameter;

    if (typeof param === 'string') {
      paramProps = { Type: param };
    } else {
      paramProps = param;
    }

    const [builder, attribs] = makeParameter(name, paramProps);
    params.push(builder);
    out[name] = attribs;
  }

  return [makeTemplateBuilder(params), out];
}
