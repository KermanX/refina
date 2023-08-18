import { D, getD, ref } from "../data";
import { HTMLElementComponent } from "../dom";
import { ViewRender } from "../view";
import {
  StatusComponent,
  StatusComponentContext,
  TriggerComponent,
  TriggerComponentContext,
  statusComponent,
  triggerComponent,
} from "./index";
import {
  OutputComponent,
  OutputComponentContext,
  outputComponent,
} from "./output";

@statusComponent("div")
export class Div extends StatusComponent {
  main(
    _: StatusComponentContext<this>,
    inner: D<string | number | ViewRender>,
  ) {
    _._div({}, inner);
  }
}
declare module "./index" {
  interface StatusComponents {
    div: Div;
  }
}

@outputComponent("span")
export class Span extends OutputComponent {
  main(
    _: OutputComponentContext<this>,
    inner: D<string | number | ViewRender>,
  ) {
    _._span({}, inner);
  }
}
declare module "./index" {
  interface OutputComponents {
    span: Span;
  }
}

@outputComponent("br")
export class BreakLine extends OutputComponent {
  main(_: OutputComponentContext<this>) {
    _._br();
  }
}
declare module "./index" {
  interface OutputComponents {
    br: BreakLine;
  }
}

@outputComponent("h1")
export class Heading1 extends OutputComponent {
  main(
    _: OutputComponentContext<this>,
    inner: D<string | number | ViewRender>,
  ) {
    _._h1({}, inner);
  }
}
declare module "./index" {
  interface OutputComponents {
    h1: Heading1;
  }
}

@outputComponent("p")
export class Paragraph extends OutputComponent {
  main(
    _: OutputComponentContext<this>,
    inner: D<string | number | ViewRender>,
  ) {
    _._p({}, inner);
  }
}

declare module "./index" {
  interface OutputComponents {
    p: Paragraph;
  }
}

@outputComponent("a")
export class Anchor extends OutputComponent {
  main(
    _: OutputComponentContext<this>,
    inner: D<string | number | ViewRender>,
    href: D<string>,
  ) {
    _._a(
      {
        href: getD(href),
      },
      inner,
    );
  }
}
declare module "./index" {
  interface OutputComponents {
    a: Anchor;
  }
}

@triggerComponent("button")
export class Button extends TriggerComponent {
  main(
    _: TriggerComponentContext<MouseEvent, this>,
    text: D<string>,
    disabled: D<boolean> = false,
  ) {
    _._button(
      {
        onclick: _.$fire,
        disabled: getD(disabled),
      },
      getD(text),
    );
  }
}
declare module "./index" {
  interface TriggerComponents {
    button: Button;
  }
}

@statusComponent("textInput")
export class TextInput extends StatusComponent {
  inputEl = ref<HTMLElementComponent<"input">>();
  main(_: StatusComponentContext<this>, value: D<string>) {
    _.$ref(this.inputEl) &&
      _._input({
        type: "text",
        value: getD(value),
        oninput: () => {
          _.$setD(value, this.inputEl.current!.node.value);
        },
        onfocus: _.$on,
        onblur: _.$off,
      });
  }
}
declare module "./index" {
  interface StatusComponents {
    textInput: TextInput;
  }
}

@statusComponent("passwordInput")
export class PasswordInput extends StatusComponent {
  inputEl = ref<HTMLElementComponent<"input">>();
  main(_: StatusComponentContext<this>, value: D<string>) {
    _.$ref(this.inputEl) &&
      _._input({
        type: "password",
        value: getD(value),
        oninput: () => {
          _.$setD(value, this.inputEl.current!.node.value);
        },
        onfocus: _.$on,
        onblur: _.$off,
      });
  }
}
declare module "./index" {
  interface StatusComponents {
    passwordInput: PasswordInput;
  }
}

@statusComponent("toggleButton")
export class ToggleButton extends StatusComponent {
  main(_: StatusComponentContext<this>, text: D<string>) {
    if (_.button(text)) {
      _.$toggle();
    }
  }
}
declare module "./index" {
  interface StatusComponents {
    toggleButton: ToggleButton;
  }
}

@statusComponent("checkbox")
export class Checkbox extends StatusComponent {
  inputEl = ref<HTMLElementComponent<"input">>();
  main(
    _: StatusComponentContext<this>,
    label: D<string>,
    value: D<boolean> = this.inputEl.current?.node.checked ?? false,
  ) {
    _._label({}, () => {
      _._t(label);
      _.$ref(this.inputEl) &&
        _._input({
          type: "checkbox",
          onchange: () => {
            _.$setD(value, this.inputEl.current!.node.checked);
            _.$status = this.inputEl.current!.node.checked;
          },
        });
    });
  }
}
declare module "./index" {
  interface StatusComponents {
    checkbox: Checkbox;
  }
}

@outputComponent("ul")
export class UnorderedList extends OutputComponent {
  main<T>(
    _: OutputComponentContext<this>,
    data: D<Iterable<T>>,
    key: keyof T | ((item: T, index: number) => D<string>),
    body: (item: T, index: number) => void,
  ): void {
    _._ul({}, () => {
      _.for(data, key, (item, index) => {
        _._li({}, () => {
          body(item, index);
        });
      });
    });
  }
}
declare module "./index" {
  interface CustomComponentFuncs<C> {
    ul: UnorderedList extends C
      ? <T>(
          data: D<Iterable<T>>,
          key: keyof T | ((item: T, index: number) => D<string>),
          body: (item: T, index: number) => void,
        ) => false
      : never;
  }
}

@outputComponent("img")
export class Image extends OutputComponent {
  main(_: OutputComponentContext<this>, src: D<string>, alt: D<string>): void {
    _._img({
      src: getD(src),
      alt: getD(alt),
    });
  }
}
declare module "./index" {
  interface OutputComponents {
    img: Image;
  }
}
