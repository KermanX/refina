import { Context, D, OutputComponent, getD } from "refina";
import MdUI from "../../plugin";

@MdUI.outputComponent("mdTitle")
export class MdTitle extends OutputComponent {
  main(_: Context, inner: D<string>, opacity: D<boolean> = false): void {
    if (getD(opacity)) {
      _.$cls`mdui-typo-title-opacity`;
    } else {
      _.$cls`mdui-typo-title`;
    }
    _._div({}, inner);
  }
}

declare module "refina" {
  interface OutputComponents {
    mdTitle: MdTitle;
  }
}
