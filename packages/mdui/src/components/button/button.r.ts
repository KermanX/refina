import { Content, D, TriggerComponent, TriggerComponentContext, getD } from "refina";
import MdUI from "../../plugin";
import { color } from "../../theme/color";
import { IconName } from "../icon";

@MdUI.triggerComponent("mdIntrinsicButton")
export class MdIntrinsicButton extends TriggerComponent<void> {
  main(
    _: TriggerComponentContext<void, this>,
    inner: D<Content>,
    color: D<color> = undefined,
    raised: D<boolean> = true,
    disabled: D<boolean> = false,
    ripple: D<boolean> = true,
    icon: D<boolean> = false,
  ): void {
    _.$cls("mdui-btn");
    getD(ripple) && _.$cls("mdui-ripple");
    getD(raised) && _.$cls("mdui-btn-raised");
    getD(color) === "primary" && _.$cls("mdui-color-theme");
    getD(color) === "accent" && _.$cls("mdui-color-theme-accent");
    getD(icon) && _.$cls("mdui-btn-icon");
    _._button(
      {
        type: "button",
        disabled: getD(disabled),
        onclick: _.$fireWith(),
      },
      inner,
    );
  }
}

@MdUI.triggerComponent("mdButton")
export class MdButton extends TriggerComponent<void> {
  main(_: TriggerComponentContext<void, this>, inner: D<Content>, disabled: D<boolean> = false): void {
    _.mdIntrinsicButton(inner, "primary", true, getD(disabled), true, false) && _.$fire();
  }
}

@MdUI.triggerComponent("mdIconButton")
export class MdIconButton extends TriggerComponent<void> {
  main(
    _: TriggerComponentContext<void, this>,
    icon: IconName,
    raised: D<boolean> = true,
    disabled: D<boolean> = false,
  ): void {
    _.mdIntrinsicButton(
      (_) => {
        _.mdIcon(icon);
      },
      undefined,
      raised,
      getD(disabled),
      true,
      true,
    ) && _.$fire();
  }
}

declare module "refina" {
  interface TriggerComponents {
    mdIntrinsicButton: MdIntrinsicButton;
    mdButton: MdButton;
    mdIconButton: MdIconButton;
  }
}
