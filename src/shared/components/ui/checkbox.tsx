"use client";

import type { ComponentProps } from "react";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Check, Minus } from "lucide-react";

import styles from "./checkbox.module.css";

export function Checkbox({ className = "", indeterminate = false, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={`${styles.root} ${className}`}
      indeterminate={indeterminate}
      {...props}
    >
      <CheckboxPrimitive.Indicator className={styles.indicator} keepMounted>
        {indeterminate ? <Minus size={12} aria-hidden="true" /> : <Check size={12} aria-hidden="true" />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
