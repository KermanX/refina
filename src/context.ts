import {
  Component,
  ComponentConstructor,
  ComponentFuncs,
} from "./component/index";
import { D, Ref, getD, ref } from "./data/index";
import {
  Content,
  DOMFuncs,
  DOMNodeComponent,
  HTMLElementComponent,
  createCbHTMLElementComponentFunction,
} from "./dom";
import { App, AppState } from "./app";

export const contextFuncs = {} as {
  [K in keyof CustomContext<any>]: K extends `$${string}`
    ? CustomContext<any>[K]
    : CustomContext<any>[K] extends (...args: any) => any
    ? (
        this: Context,
        ckey: string,
        ...args: Parameters<CustomContext<any>[K]>
      ) => ReturnType<CustomContext<any>[K]>
    : never;
};

export interface CustomContext<C> {}

export type ToFullContext<C, I> = {
  t(template: TemplateStringsArray, ...args: any[]): void;
  t(text: D<string>): void;
} & ComponentFuncs<C> &
  CustomContext<C> &
  DOMFuncs<C> &
  I;

export class IntrinsicContext<C> {
  constructor(public readonly $app: App) {
    Object.defineProperty(this, "$ev", {
      get() {
        return $app.eventData;
      },
    });
    Object.defineProperty(this, "$", {
      get() {
        return this.$app.eventRecevier ?? this.$cbComponent;
      },
    });
  }

  $update() {
    this.$app.update();
  }

  get $state() {
    return this.$app.state;
  }
  get $updating() {
    return this.$state === AppState.update;
  }
  get $receiving() {
    return this.$state === AppState.recv;
  }
  get $router() {
    return this.$app.router;
  }
  $cbComponent: C = null as any;

  protected $lastRef = ref<any>();

  $preventDefault(): true {
    const ev = this.$app.eventData;
    if (typeof ev?.preventDefault !== "function") {
      throw new Error(`Cannot prevent default on ${ev}.`);
    }
    ev.preventDefault();
    return true;
  }
  $stopPropagation(): true {
    const ev = this.$app.eventData;
    if (typeof ev?.stopPropagation !== "function") {
      throw new Error(`Cannot stop propagation on ${ev}.`);
    }
    ev.stopPropagation();
    return true;
  }
  $stopImmediatePropagation(): true {
    const ev = this.$app.eventData;
    if (typeof ev?.stopImmediatePropagation !== "function") {
      throw new Error(`Cannot stop immediate propagation on ${ev}.`);
    }
    ev.stopImmediatePropagation();
    return true;
  }

  $ref<C2>(ref: Ref<C2>): this is Context<C2> {
    this.$pendingRef = ref;
    return true;
  }
  $pendingRef = this.$lastRef;

  $noPreserve(deep: boolean = true): true {
    this.$pendingNoPreserve = deep ? "deep" : true;
    return true;
  }
  protected $pendingNoPreserve: boolean | "deep" = false;
  protected $allNoPreserve = false;
  protected get $isNoPreserve() {
    return Boolean(this.$allNoPreserve || this.$pendingNoPreserve);
  }

  $cls(cls: string): true;
  $cls(template: TemplateStringsArray, ...args: any[]): true;
  $cls(...args: any[]): true {
    this.$pendingClasses = (
      Array.isArray(args[0])
        ? String.raw({ raw: args[0] }, ...args.slice(1))
        : args[0]
    )
      .split(/\s/)
      .filter(Boolean);
    return true;
  }
  protected $pendingClasses: string[] = [];
  get $classes() {
    const classes = this.$pendingClasses;
    this.$pendingClasses = [];
    return classes;
  }

  $css(style: string): void;
  $css(template: TemplateStringsArray, ...args: any[]): void;
  $css(...args: any[]): void {
    this.$pendingStyle = Array.isArray(args[0])
      ? String.raw({ raw: args[0] }, ...args.slice(1))
      : args[0];
  }
  protected $pendingStyle: string = "";
  get $style() {
    const style = this.$pendingStyle;
    this.$pendingStyle = "";
    return style;
  }

  protected get $runtimeData() {
    return this.$app.runtimeData!;
  }
  $provide(key: symbol, value: unknown): true {
    this.$runtimeData[key] = value;
    return true;
  }
  $unprovide(key: symbol): true {
    delete this.$runtimeData[key];
    return true;
  }
  $forceInject<T>(key: symbol, errorMessage?: string): T {
    if (!(key in this.$runtimeData)) {
      throw new Error(
        errorMessage ?? `Cannot inject ${key.toString()}: not provided.`,
      );
    }
    return this.$runtimeData[key];
  }
  $inject<T>(key: symbol, fallback?: T): T {
    return this.$runtimeData[key] ?? fallback;
  }

  $customData: Record<symbol, any> = {};

  $$(funcName: string, ckey: string, ...args: any[]): any {
    if (
      funcName.startsWith("_cb") &&
      funcName[3].toUpperCase() === funcName[3]
    ) {
      // Now this is a cb-style HTML element
      const tagName = (funcName[3].toLowerCase() +
        funcName.slice(4)) as keyof HTMLElementTagNameMap;
      const func = createCbHTMLElementComponentFunction(tagName);
      return func.call(this as unknown as Context, ckey, ...args);
    }
    if (funcName[0] === "_") {
      // Now this is a HTML element
      const tagName = funcName.slice(1) as keyof HTMLElementTagNameMap;
      let [data, inner] = args;
      return this.processHTMLElement(
        ckey,
        tagName,
        this.$classes,
        this.$style,
        data,
        inner,
      );
    }
    // Now this is a user-defined component
    const func = contextFuncs[funcName as keyof typeof contextFuncs];
    if (!func) {
      throw new Error(`Unknown element ${funcName}`);
    }
    //@ts-ignore
    return func.call(this as unknown as Context, ckey, ...args);
  }

  $$t(ckey: string, text: D<string>): any {
    if (this.$classes.length > 0) {
      throw new Error(`Text node cannot have classes`);
    }
    if (this.$style.length > 0) {
      throw new Error(`Text node cannot have style`);
    }
    return this.processTextNode(ckey, getD(text));
  }

  $firstDOMNode: DOMNodeComponent | null = null;
  $setFirstDOMNode(node: DOMNodeComponent) {
    this.$firstDOMNode ??= node;
  }
  $firstHTMLELement: HTMLElementComponent | null = null;
  $setFirstHTMLELement(element: HTMLElementComponent) {
    this.$firstHTMLELement ??= element;
  }

  beginComponent<T extends Component>(
    ckey: string,
    ctor: ComponentConstructor<T>,
  ) {
    this.$app.callHookAfterThisComponent();

    this.$app.pushKey(ckey);
    const ikey = this.$app.ikey;
    this.$app.markComponentProcessed(ikey);
    let component = this.$app.refMap.get(ikey) as T;
    if (!component) {
      component = new ctor(ikey, this.$app);
      this.$app.refMap.set(ikey, component);
    }

    this.$pendingRef.current = component;
    this.$pendingRef = this.$lastRef;

    if (this.$isNoPreserve) {
      this.$app.noPreserveComponents.add(ikey);
      // later set by IntrinsicComponentContext:
      //   this.$pendingNoPreserve = false;
    }
    return component;
  }
  endComponent(ckey: string) {
    this.$app.popKey(ckey);
  }

  normalizeContent(content: D<Content> = () => {}): View {
    const contentValue = getD(content);
    if (typeof contentValue === "string" || typeof contentValue === "number") {
      const text = contentValue;
      return () => {
        if (this.$classes.length > 0) {
          throw new Error(`Text node cannot have classes`);
        }
        if (this.$style.length > 0) {
          throw new Error(`Text node cannot have style`);
        }
        this.processTextNode("_t", String(text));
      };
    }
    return contentValue;
  }

  protected processHTMLElement<E extends keyof HTMLElementTagNameMap>(
    ckey: string,
    tagName: E,
    classes: string[],
    style: string,
    data?: Partial<HTMLElementTagNameMap[E]>,
    inner?: D<Content>,
  ) {
    data ??= {};
    inner = this.normalizeContent(inner);

    this.$app.callHookAfterThisComponent();

    this.$app.pushKey(ckey);
    const ikey = this.$app.ikey;
    this.$app.markComponentProcessed(ikey);
    let ec = this.$app.refMap.get(ikey) as HTMLElementComponent | undefined;
    const oldParent = this.$app.currrentHTMLParent;
    if (this.$updating) {
      if (!ec) {
        ec = new HTMLElementComponent(ikey, document.createElement(tagName));
        this.$app.refMap.set(ikey, ec);
      }
      for (const key in data) {
        //@ts-ignore
        ec.node[key] = data[key]!;
      }
      ec.setClasses(classes);
      ec.setStyle(style);
      oldParent.children.push(ec);
      ec.children = [];
    }

    const context = new IntrinsicContext(this.$app);

    this.$setFirstDOMNode(ec!);
    this.$setFirstHTMLELement(ec!);

    this.$pendingRef.current = ec;
    this.$pendingRef = this.$lastRef;

    if (this.$isNoPreserve) {
      this.$app.noPreserveComponents.add(ikey);
      if (this.$pendingNoPreserve === "deep") context.$allNoPreserve = true;
      this.$pendingNoPreserve = false;
    }

    this.$app.currrentHTMLParent = ec!;

    inner(context as unknown as Context);

    this.$app.callHookAfterThisComponent();

    this.$app.currrentHTMLParent = oldParent;

    this.$app.popKey(ckey);

    return ec!;
  }
  protected processTextNode(ckey: string, text: string) {
    this.$app.callHookAfterThisComponent();

    this.$app.pushKey(ckey);
    const ikey = this.$app.ikey;
    this.$app.markComponentProcessed(ikey);
    let t = this.$app.refMap.get(ikey) as DOMNodeComponent | undefined;
    if (this.$updating) {
      if (!t) {
        t = new DOMNodeComponent(ikey, document.createTextNode(text));
        this.$app.refMap.set(ikey, t);
      } else {
        if (t.node.textContent !== text) t.node.textContent = text;
      }
      this.$app.currrentHTMLParent.children.push(t);
    }
    this.$app.popKey(ckey);

    this.$firstDOMNode ??= t!;

    if (this.$allNoPreserve || this.$pendingNoPreserve) {
      this.$app.noPreserveComponents.add(ikey);
      this.$pendingNoPreserve = false;
    }

    return t!;
  }
}

export type Context<C = any> = ToFullContext<C, IntrinsicContext<C>>;

export type View<Args extends any[] = []> = (
  context: Context,
  ...args: Args
) => void;

export function view<Args extends any[] = []>(view: View<Args>): View<Args> {
  return view;
}

export class IntrinsicAppContext<C> extends IntrinsicContext<C> {
  $rootCls(cls: string): true;
  $rootCls(template: TemplateStringsArray, ...args: any[]): true;
  $rootCls(...args: any[]): true {
    this.$app.root.setClasses(
      (Array.isArray(args[0])
        ? String.raw({ raw: args[0] }, ...args.slice(1))
        : args[0]
      )
        .split(/\s/)
        .filter(Boolean),
    );
    return true;
  }

  $rootCss(style: string): void;
  $rootCss(template: TemplateStringsArray, ...args: any[]): void;
  $rootCss(...args: any[]): void {
    this.$app.root.setStyle(
      Array.isArray(args[0])
        ? String.raw({ raw: args[0] }, ...args.slice(1))
        : args[0],
    );
  }
}

export type AppContext<C = any> = ToFullContext<C, IntrinsicAppContext<C>>;

export type AppView = (_: AppContext) => void;
