import {
  TemplateBuilder,
  makeAwsResource,
  awsStr,
  makeTemplateBuilder,
  ResourceAttributes,
} from '@cfnutil/core';
import {
  ResourceType,
  ApiGatewayRestApiAttributes,
  ApiGatewayMethodIntegration,
  ApiGatewayMethodMethodResponse,
} from '@fmtk/cfntypes';

export interface MaintenanceApiProps {
  DeploymentTag?: string;
  Name: string;
  Response?: string;
  StageName?: string;
  StatusCode?: string;
}

export function makeMaintenanceApi(
  name: string,
  props: MaintenanceApiProps,
): [TemplateBuilder, ResourceAttributes<ApiGatewayRestApiAttributes>] {
  const {
    Name,
    Response = JSON.stringify({
      error: 'down for maintenance',
    }),
    StageName = 'prod',
    StatusCode = '503',
  } = props;

  const [restApiBuilder, restApi] = makeAwsResource(
    ResourceType.ApiGatewayRestApi,
    `${name}ApiGateway`,
    {
      Name,
    },
  );

  const [wildcardResourceBuilder, wildcardResource] = makeAwsResource(
    ResourceType.ApiGatewayResource,
    `${name}WildcardProy`,
    {
      ParentId: restApi.out.RootResourceId,
      PathPart: '{proxy+}',
      RestApiId: restApi.ref,
    },
  );

  const mock: ApiGatewayMethodIntegration = {
    Type: 'MOCK',
    IntegrationResponses: [
      {
        ResponseTemplates: {
          'application/json': Response,
        },
        StatusCode,
      },
    ],
    PassthroughBehavior: 'WHEN_NO_MATCH',
    RequestTemplates: {
      'application/json': awsStr`{"statusCode":${StatusCode}}`,
    },
  };

  const responses: ApiGatewayMethodMethodResponse[] = [
    {
      StatusCode,
    },
  ];

  const [wildcardMethodBuilder, wildcardMethod] = makeAwsResource(
    ResourceType.ApiGatewayMethod,
    `${name}WildcardProxyMethod`,
    {
      AuthorizationType: 'NONE',
      HttpMethod: 'ANY',
      Integration: mock,
      MethodResponses: responses,
      ResourceId: wildcardResource.ref,
      RestApiId: restApi.ref,
    },
  );

  const [rootMethodBuilder, rootMethod] = makeAwsResource(
    ResourceType.ApiGatewayMethod,
    `${name}RootProxyMethod`,
    {
      AuthorizationType: 'NONE',
      HttpMethod: 'ANY',
      Integration: mock,
      MethodResponses: responses,
      ResourceId: restApi.out.RootResourceId,
      RestApiId: restApi.ref,
    },
  );

  const [deploymentBuilder, deployment] = makeAwsResource(
    ResourceType.ApiGatewayDeployment,
    `${name}Deployment${props.DeploymentTag || ''}`,
    {
      RestApiId: restApi.ref,
    },
    {
      DependsOn: [wildcardMethod.name, rootMethod.name],
    },
  );

  const [stageBuilder] = makeAwsResource(
    ResourceType.ApiGatewayStage,
    `${name}Stage`,
    {
      DeploymentId: deployment.ref,
      RestApiId: restApi.ref,
      MethodSettings: [
        {
          HttpMethod: '*',
          LoggingLevel: 'INFO',
          ResourcePath: '/*',
        },
      ],
      StageName,
    },
  );

  return [
    makeTemplateBuilder([
      restApiBuilder,
      wildcardResourceBuilder,
      wildcardMethodBuilder,
      rootMethodBuilder,
      deploymentBuilder,
      stageBuilder,
    ]),
    restApi,
  ];
}
