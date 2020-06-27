export interface ServicePrincipal {
  Service: string | string[];
}

export interface AwsPrincipal {
  AWS: string | string[];
}

export interface CanonicalUserPrincipal {
  CanonicalUser: string;
}

export type Principal =
  | ServicePrincipal
  | AwsPrincipal
  | CanonicalUserPrincipal;
