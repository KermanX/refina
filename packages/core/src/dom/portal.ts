import { Prelude } from "../constants";
import { Context, IntrinsicContext } from "../context";
import { D } from "../data";
import { Content } from "./content";
import { DOMElementComponent } from "./element";
import { DOMNodeComponent, MaybeChildNode } from "./node";

export class DOMPortalComponent extends DOMElementComponent {
  /**
   * Children to be removed when update mount.
   */
  protected childrenToRemove: Set<DOMNodeComponent>;

  updateDOM(): null {
    this.childrenToRemove = new Set<DOMNodeComponent>(this.mountedChildren);
    for (const child of this.pendingChildren) {
      // Update the child node.
      child.updateDOM();
      // Do not remove this child node.
      this.childrenToRemove.delete(child);
    }

    // Do not update the mounted child nodes, which will be updated in `updateMount`.

    // The last updated child node of portal is useless.
    return null;
  }

  /**
   * Update the DOM tree of the portal.
   * @param lastNode The last updated node.
   * @returns the new last updated node.
   */
  updateMount(lastNode: MaybeChildNode) {
    for (const child of this.pendingChildren) {
      if (!this.mountedChildren.has(child)) {
        // This child node is not mounted yet.
        if (lastNode) {
          // There is a last updated child node.
          // Insert this child node after the last updated child node.
          child.insertAfter(lastNode);
        } else {
          // There is no last updated child node.
          // We should insert this child node as the first child node.
          child.prependTo(this.node);
        }
      }
      // Update the last updated child node.
      lastNode = child.asChildNode ?? lastNode;
    }

    // Remove mounted child nodes that are no longer used.
    for (const child of this.childrenToRemove) {
      child.removeFrom(this.node);
    }

    // Update the mounted child nodes.
    this.mountedChildren = new Set(this.pendingChildren);
    this.pendingChildren = [];

    return lastNode;
  }

  /**
   * Remove the portal from the DOM tree.
   */
  unmount() {
    for (const child of this.mountedChildren) {
      child.removeFrom(this.node);
    }

    // Clear the mounted children.
    this.mountedChildren = new Set();
    this.pendingChildren = [];
  }

  addEventListener(_event: any, _listener: any, _options: any): never {
    throw new Error("Cannot add event listener to portal.");
  }

  addEventListeners(_listeners: any): never {
    throw new Error("Cannot add event listeners to portal.");
  }

  addCls(_classes: string): void {
    throw new Error("Cannot add classes to portal.");
  }

  addCss(_style: string) {
    throw new Error("Cannot add styles to portal.");
  }

  get asChildNode(): null {
    return null;
  }

  insertAfter(_node: ChildNode): void {}

  prependTo(_parent: Element): void {}

  removeFrom(_parent: Element): void {}
}

Prelude.registerFunc("portal", function (ckey: string, inner: D<Content>) {
  const ikey: string = this.$app.pushKey(ckey);
  const context = new IntrinsicContext(this.$app) as unknown as Context;
  let portal = this.$app.refMap.get(ikey) as DOMPortalComponent | undefined;
  if (!portal) {
    portal = new DOMPortalComponent(ikey, this.$app.root.node);
    this.$app.refMap.set(ikey, portal);
  }

  const updateState = this.$updateState;
  if (updateState) {
    this.$$fulfillRef(portal);

    this.$app.root.pendingPortals.push(portal);

    context.$$updateDOMContent(updateState, portal, inner);
  } else {
    context.$$recvDOMContent(inner);
  }

  this.$app.popKey(ikey);
  return portal;
});

declare module "../context" {
  interface ContextFuncs<C extends ContextState> {
    /**
     * Render content to the end of the root element.
     *
     * This is usefull when you want to render a dialog or a tooltip
     *  that should not be affected by the parent element's styles.
     */
    portal: DOMPortalComponent extends C["enabled"]
      ? (inner: D<Content>) => void
      : never;
  }
}
