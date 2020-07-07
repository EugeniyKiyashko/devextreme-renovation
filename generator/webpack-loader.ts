import { getOptions } from "loader-utils";
import { compileCode } from "./component-compiler";
import { ReactGenerator } from "./react-generator";
import { AngularGenerator } from "./angular-generator/angular-generator";
import { VueGenerator } from "./vue-generator/vue-generator";
import { PreactGenerator } from "./preact-generator";
import ts from "typescript";
import path from "path";
import { GeneratorOptions } from "./base-generator/types";

function getTsConfig(filename: string) {
  const { config, error } = ts.readConfigFile(filename, ts.sys.readFile);
  if (error && error.length) {
    return {};
  }
  let baseConfig: any = {};
  if (config.extends) {
    baseConfig = getTsConfig(
      path.resolve(path.dirname(filename), config.extends)
    );
  }
  return {
    ...baseConfig,
    ...config,
    compilerOptions: {
      ...baseConfig.compilerOptions,
      ...config.compilerOptions,
      sourceMap: false,
    },
  };
}

export default function (this: any, source: string) {
  const {
    platform,
    defaultOptionsModule,
    jqueryComponentRegistratorModule,
    jqueryBaseComponentModule,
    tsConfig,
  } = getOptions(this) as any;
  let generator = null;

  const options: GeneratorOptions = { defaultOptionsModule };

  switch (platform) {
    case "react":
      generator = new ReactGenerator();
      break;
    case "angular":
      generator = new AngularGenerator();
      break;
    case "vue":
      generator = new VueGenerator();
      break;
    case "preact":
      generator = new PreactGenerator();
      generator.options = {
        jqueryComponentRegistratorModule,
        jqueryBaseComponentModule,
      };
      break;
    default:
      throw new Error("Invalid platform");
  }

  generator.options = {
    ...generator.options,
    ...options,
  };

  const result = compileCode(
    generator,
    source,
    {
      path: this.resourcePath,
      dirname: path.dirname(this.resourcePath),
    },
    false
  );

  if (tsConfig) {
    return ts.transpileModule(result as string, getTsConfig(tsConfig))
      .outputText;
  }
  return result;
}