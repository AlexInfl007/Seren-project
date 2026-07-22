import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type Props<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export default function Container<T extends ElementType = "div">({ as, children, className = "", ...props }: Props<T>) {
  const Component = as ?? "div";
  return <Component className={`container ${className}`.trim()} {...props}>{children}</Component>;
}
