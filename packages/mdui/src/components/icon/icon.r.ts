import { D, OutputComponent, OutputComponentContext, getD } from "refina";
import type { IconName } from "./icon.asset";
// import { fontMap } from "./icon.asset";
import mdui from "mdui";
import MdUI from "../../plugin";

@MdUI.outputComponent("mdIcon")
export class MdIcon extends OutputComponent {
  main(_: OutputComponentContext<this>, inner: D<IconName>): void {
    _.$cls`mdui-icon` && _.$cls`material-icons`;
    // _._i({}, fontMap[getD(inner)]);
    _._i({}, getD(inner)); // I don't know why but it works

    mdui.mutation();
  }
}

declare module "refina" {
  interface OutputComponents {
    mdIcon: MdIcon;
  }
}
