export type IntrinsicValue = any;

export const Intrinsics = {
  /**
   * Returns true if all the specified conditions evaluate to true, or returns
   * false if any one of the conditions evaluates to false. Fn::And acts as an
   * AND operator. The minimum number of conditions that you can include is 2,
   * and the maximum is 10.
   *
   * @param conditions A condition that evaluates to true or false.
   *
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#intrinsic-function-reference-conditions-and
   */
  and(...conditions: IntrinsicValue[]): IntrinsicValue {
    return { 'Fn::And': conditions };
  },

  /**
   * The intrinsic function Fn::Base64 returns the Base64 representation of the
   * input string. This function is typically used to pass encoded data to
   * Amazon EC2 instances by way of the UserData property.
   *
   * @param valueToEncode The string value you want to convert to Base64.
   * @returns The original string, in Base64 representation.
   *
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-base64.html
   */
  base64(valueToEncode: IntrinsicValue): IntrinsicValue {
    return { 'Fn::Base64': valueToEncode };
  },

  /**
   * The intrinsic function Fn::Cidr returns an array of CIDR address blocks.
   * The number of CIDR blocks returned is dependent on the count parameter.
   *
   * @param ipBlock The user-specified CIDR address block to be split into
   * smaller CIDR blocks.
   * @param count The number of CIDRs to generate. Valid range is between 1 and
   * 256.
   * @param cidrBits The number of subnet bits for the CIDR. For example,
   * specifying a value "8" for this parameter will create a CIDR with a mask of
   * "/24".
   * @returns An array of CIDR address blocks.
   *
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-cidr.html
   */
  cidr(
    ipBlock: IntrinsicValue,
    count: IntrinsicValue,
    cidrBits: IntrinsicValue,
  ): IntrinsicValue {
    return { 'Fn::Cidr': [ipBlock, count, cidrBits] };
  },

  /**
   * Compares if two values are equal. Returns true if the two values are equal
   * or false if they aren't.
   *
   * @param value1 A value of any type that you want to compare.
   * @param value2 A value of any type that you want to compare.
   *
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#intrinsic-function-reference-conditions-equals
   */
  equals(...conditions: IntrinsicValue[]): IntrinsicValue {
    return { 'Fn::And': conditions };
  },

  /**
   * The intrinsic function Fn::FindInMap returns the value corresponding to
   * keys in a two-level map that is declared in the Mappings section.
   *
   * @param mapName The logical name of a mapping declared in the Mappings
   * section that contains the keys and values.
   * @param topLevelKey The top-level key name. Its value is a list of key-value pairs.
   * @param secondLevelKey The second-level key name, which is set to one of the keys from the list assigned to TopLevelKey.
   * @returns The value that is assigned to SecondLevelKey.
   *
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-findinmap.html
   */
  findInMap(
    mapName: string,
    topLevelKey: string,
    secondLevelKey: string,
  ): IntrinsicValue {
    return { 'Fn::FindInMap': [mapName, topLevelKey, secondLevelKey] };
  },

  /**
   * The Fn::GetAtt intrinsic function returns the value of an attribute from a
   * resource in the template. For more information about GetAtt return values
   * for a particular resource, refer to the documentation for that resource in
   * the Resource and Property Reference.
   *
   * @param logicalNameOfResource The logical name (also called logical ID) of
   * the resource that contains the attribute that you want.
   * @param attributeName The name of the resource-specific attribute whose
   * value you want. See the resource's reference page for details about the
   * attributes available for that resource type.
   * @returns The attribute value.
   *
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-getatt.html
   */
  getAtt(logicalNameOfResource: string, attributeName: string): IntrinsicValue {
    return { 'Fn::GetAtt': [logicalNameOfResource, attributeName] };
  },

  /**
   * The intrinsic function Fn::GetAZs returns an array that lists Availability
   * Zones for a specified region. Because customers have access to different
   * Availability Zones, the intrinsic function Fn::GetAZs enables template
   * authors to write templates that adapt to the calling user's access. That
   * way you don't have to hard-code a full list of Availability Zones for a
   * specified region.
   *
   * @param region The name of the region for which you want to get the
   * Availability Zones. You can use the AWS::Region pseudo parameter to
   * specify the region in which the stack is created. Specifying an empty
   * string is equivalent to specifying AWS::Region.
   * @returns The list of Availability Zones for the region.
   *
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-getavailabilityzones.html
   */
  getAZs(region: string): IntrinsicValue {
    return { 'Fn::GetAZs': region };
  },

  /**
   * Returns one value if the specified condition evaluates to true and another
   * value if the specified condition evaluates to false. Currently, AWS
   * CloudFormation supports the Fn::If intrinsic function in the metadata
   * attribute, update policy attribute, and property values in the Resources
   * section and Outputs sections of a template. You can use the AWS::NoValue
   * pseudo parameter as a return value to remove the corresponding property.
   *
   * @param conditionName A reference to a condition in the Conditions section.
   * Use the condition's name to reference it.
   * @param valueIfTrue A value to be returned if the specified condition
   * evaluates to true.
   * @param valueIfFalse A value to be returned if the specified condition
   * evaluates to false.
   *
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#intrinsic-function-reference-conditions-if
   */
  ifThen(
    conditionName: string,
    valueIfTrue: IntrinsicValue,
    valueIfFalse: IntrinsicValue,
  ): IntrinsicValue {
    return { 'Fn::If': [conditionName, valueIfTrue, valueIfFalse] };
  },

  /**
   * The intrinsic function Fn::ImportValue returns the value of an output
   * exported by another stack. You typically use this function to create
   * cross-stack references. In the following example template snippets, Stack A
   * exports VPC security group values and Stack B imports them.
   *
   * @param sharedValueToImport The stack output value that you want to import.
   * @returns The stack output value.
   *
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-importvalue.html
   */
  importValue(sharedValueToImport: string): IntrinsicValue {
    return { 'Fn::ImportValue': sharedValueToImport };
  },

  /**
   * The intrinsic function Fn::Join appends a set of values into a single
   * value, separated by the specified delimiter. If a delimiter is the empty
   * string, the set of values are concatenated with no delimiter.
   *
   * @param delimiter The value you want to occur between fragments. The
   * delimiter will occur between fragments only. It will not terminate the
   * final value.
   * @param listOfValues The list of values you want combined.
   * @returns The combined string.
   *
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-join.html
   */
  join(delimiter: string, listOfValues: IntrinsicValue[]): IntrinsicValue {
    return { 'Fn::Join': [delimiter, listOfValues] };
  },

  /**
   * Returns true for a condition that evaluates to false or returns false for a
   * condition that evaluates to true. Fn::Not acts as a NOT operator.
   *
   * @param condition A condition such as Fn::Equals that evaluates to true or
   * false.
   *
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#intrinsic-function-reference-conditions-not
   */
  not(condition: string): IntrinsicValue {
    return { 'Fn::Not': [condition] };
  },

  /**
   * Returns true if any one of the specified conditions evaluate to true, or
   * returns false if all of the conditions evaluates to false. Fn::Or acts as
   * an OR operator. The minimum number of conditions that you can include is 2,
   * and the maximum is 10.
   *
   * @param conditions A condition that evaluates to true or false.
   *
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-conditions.html#intrinsic-function-reference-conditions-or
   */
  or(...conditions: IntrinsicValue[]): IntrinsicValue {
    return { 'Fn::Or': conditions };
  },

  /**
   * The intrinsic function Fn::Sub substitutes variables in an input string
   * with values that you specify. In your templates, you can use this function
   * to construct commands or outputs that include values that aren't available
   * until you create or update a stack.
   *
   * @param text A string with variables that AWS CloudFormation substitutes
   * with their associated values at runtime. Write variables as ${MyVarName}.
   * Variables can be template parameter names, resource logical IDs,
   * resource attributes, or a variable in a key-value map. If you specify only
   * template parameter names, resource logical IDs, and resource attributes,
   * don't specify a key-value map.
   *
   * If you specify template parameter names or resource logical IDs, such as
   * ${InstanceTypeParameter}, AWS CloudFormation returns the same values as if
   * you used the Ref intrinsic function. If you specify resource attributes,
   * such as ${MyInstance.PublicIp}, AWS CloudFormation returns the same values
   * as if you used the Fn::GetAtt intrinsic function.
   *
   * To write a dollar sign and curly braces (${}) literally, add an exclamation
   * point (!) after the open curly brace, such as ${!Literal}. AWS
   * CloudFormation resolves this text as ${Literal}.
   *
   * @param values A map of values that AWS CloudFormation substitutes for the
   * associated variable names at runtime.
   *
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-sub.html
   */
  sub(text: string, values: Record<string, IntrinsicValue>): IntrinsicValue {
    return { 'Fn::Sub': [text, values] };
  },

  /**
   * The intrinsic function Ref returns the value of the specified parameter or
   * resource.
   *
   * - When you specify a parameter's logical name, it returns the value of the
   * parameter.
   *
   * - When you specify a resource's logical name, it returns a value that you
   * can typically use to refer to that resource, such as a physical ID.
   *
   * When you are declaring a resource in a template and you need to specify
   * another template resource by name, you can use the Ref to refer to that
   * other resource. In general, Ref returns the name of the resource. For
   * example, a reference to an AWS::AutoScaling::AutoScalingGroup returns the
   * name of that Auto Scaling group resource.
   *
   * @param logicalName The logical name of the resource or parameter you want
   * to dereference.
   *
   * @returns The physical ID of the resource or the value of the parameter.
   *
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-ref.html
   */
  ref(logicalName: string): IntrinsicValue {
    return { Ref: logicalName };
  },

  /**
   * The intrinsic function Fn::Select returns a single object from a list of
   * objects by index.
   *
   * @param index The index of the object to retrieve. This must be a value from
   * zero to N-1, where N represents the number of elements in the array.
   * @param listOfObjects The list of objects to select from. This list must not
   * be null, nor can it have null entries.
   * @returns The selected object.
   *
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-select.html
   */
  select(index: number, listOfObjects: IntrinsicValue[]): IntrinsicValue {
    return { 'Fn::Select': [index, listOfObjects] };
  },

  /**
   * To split a string into a list of string values so that you can select an
   * element from the resulting string list, use the Fn::Split intrinsic
   * function. Specify the location of splits with a delimiter, such as , (a
   * comma). After you split a string, use the Fn::Select function to pick a
   * specific element.
   *
   * @param delimiter A string value that determines where the source string is
   * divided.
   * @param sourceString The string value that you want to split.
   * @returns A list of string values.
   *
   * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-split.html
   */
  split(delimiter: string, sourceString: string): IntrinsicValue {
    return { 'Fn::Split': [delimiter, sourceString] };
  },
};
