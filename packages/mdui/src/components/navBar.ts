import { Component, Content, _, elementRef, valueOf } from "refina";

export class MdNavBar<Value extends string> extends Component {
  navBarRef = elementRef<"mdui-navigation-bar">();
  status: Value;
  $main(
    options: (Value | [value: Value, iconName?: string])[],
    contentOverride: Partial<Record<Value, Content>> = {},
  ): Value {
    const firstOption = valueOf(options)[0];
    this.status ??= Array.isArray(firstOption) ? firstOption[0] : firstOption;

    _.$ref(this.navBarRef);
    _._mdui_navigation_bar(
      {
        value: this.status,
        onchange: () => {
          this.status = this.navBarRef.current!.node.value! as Value;
          this.$update();
        },
      },
      _ =>
        _.for(
          options,
          option => (Array.isArray(option) ? option[0] : option),
          option => {
            const [value, icon] = Array.isArray(option) ? option : [option];
            _._mdui_navigation_bar_item(
              {
                value,
                icon,
              },
              contentOverride[value] ?? value,
            );
          },
        ),
    );
    return this.status;
  }
}
