import { Content } from "../dom";
import { D, TriggerComponent, TriggerComponentContext, triggerComponent } from "../lib";

@triggerComponent("rButton")
export class RButton extends TriggerComponent<MouseEvent> {
  main(_: TriggerComponentContext<MouseEvent, this>, inner: D<Content>, disabled: D<boolean> = false) {
    _.$cls`rounded disabled:opacity-50`;
    if (_.button(inner, disabled)) {
      _.$fire(_.$ev);
    }
  }
}

declare module "../component/index" {
  interface TriggerComponents {
    rButton: RButton;
  }
}
