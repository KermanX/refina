import {
  ComponentContext,
  Content,
  D,
  DArray,
  DPartialRecord,
  HTMLElementComponent,
  StatusComponent,
  bySelf,
  getD,
  ref,
} from "refina";
import MdUI2 from "../plugin";

@MdUI2.statusComponent("mdNavRail")
export class MdNavRail<Value extends string> extends StatusComponent<Value> {
  navRailRef = ref<HTMLElementComponent<"mdui-navigation-rail">>();
  main(
    _: ComponentContext,
    items: DArray<Value | [value: Value, iconName?: string]>,
    contentOverride: DPartialRecord<Value, Content> = {},
    bottomSlot?: D<Content>,
  ): void {
    const contentOverrideValue = getD(contentOverride);

    const firstItem = getD(getD(items)[0]);
    this.$_status ??= Array.isArray(firstItem) ? firstItem[0] : firstItem;

    _.$ref(this.navRailRef) &&
      _._mdui_navigation_rail(
        {
          value: this.$status,
          onchange: () => {
            this.$status = this.navRailRef.current!.node.value as Value;
          },
        },
        _ => {
          _.for(items, bySelf, item => {
            const itemValue = getD(item);
            const [value, icon] = Array.isArray(itemValue) ? itemValue : [itemValue];
            _._mdui_navigation_rail_item(
              {
                value,
                icon,
              },
              contentOverrideValue[value] ?? value,
            );
          });

          if (bottomSlot) {
            _._div({ slot: "bottom" }, bottomSlot);
          }
        },
      );
  }
}

declare module "refina" {
  interface ContextFuncs<C> {
    mdNavRail: MdNavRail<any> extends C["enabled"]
      ? <Value extends string>(
          items: DArray<Value | [value: Value, iconName?: string]>,
          contentOverride?: DPartialRecord<Value, Content>,
          bottomSlot?: D<Content>,
        ) => Value
      : never;
  }
}
