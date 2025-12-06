interface InputAnchor {
  options?: any; // optionalに変更
  id: string;
  type?: string;
  label?: string;
  optional?: boolean;
  description?: string;
}


interface InputParam {
  id: string; // 必須
  additionalParams?: boolean;
  hidden?: boolean;
  [key: string]: any;
}

interface OutputAnchor {
  id: string;       // Required in OutputAnchor
  label: string;    // Required in OutputAnchor
  type?: string;    // Optional properties from NodeOutput
  description?: string;
  baseClasses?: string[];
  isAnchor?: boolean;
  hidden?: boolean;
  options?: NodeOutput[];
  default?: string;
}

interface NodeInput {
  optional?: boolean;
  hidden: any;
  additionalParams?: boolean;
  name: string;
  type: string;
  default?: string | number | boolean;
  label?: string;
  description?: string;
  id?: string;
}

interface NodeOutput {
  name: string;
  label?: string;
  description?: string;
  type?: string;
  baseClasses?: string[];
  isAnchor?: boolean;
  hidden?: boolean;
  id?: string;
  options?: NodeOutput[];
  default?: string;
}

interface NodeCredential {
  name: string;
  type: string;
}
interface NodeData {
  author?: any;
  badge?: any;
  tags?: any;
  label: string;
  version?: number;
  category: string;
  icon?: string;
  filePath?: string;
  data?: any;
  name: string;
  type: string;
  id: string;
  description: string;
  inputs?: NodeInput[] | Record<string, any>; // 修正
  outputs?: NodeOutput[] | Record<string, any>; // 修正
  credential?: NodeCredential;
  baseClasses?: string[];
  hideOutput?: boolean;
  selected?: boolean;
  inputAnchors: InputAnchor[];
  outputAnchors: NodeOutput[];
  inputParams: NodeInput[];
}
