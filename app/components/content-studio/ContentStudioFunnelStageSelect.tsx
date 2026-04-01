"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONTENT_STUDIO_FUNNEL_STAGES,
  CONTENT_STUDIO_FUNNEL_STAGE_UNSET,
} from "@/lib/content-studio/constants";
import { formatFunnelStage } from "@/lib/growth-os/friendlyCopy";

const presetSet = new Set<string>(CONTENT_STUDIO_FUNNEL_STAGES);

export function ContentStudioFunnelStageSelect({
  id,
  value,
  onValueChange,
  disabled,
  className,
}: {
  id?: string;
  value: string;
  onValueChange: (next: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const legacy = value && !presetSet.has(value) ? value : null;
  const selectValue = !value || value === "" ? CONTENT_STUDIO_FUNNEL_STAGE_UNSET : legacy ?? value;

  return (
    <Select
      value={selectValue}
      disabled={disabled}
      onValueChange={(v) => onValueChange(v === CONTENT_STUDIO_FUNNEL_STAGE_UNSET ? "" : v)}
    >
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder="Choose funnel stage" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={CONTENT_STUDIO_FUNNEL_STAGE_UNSET}>Not set</SelectItem>
        {CONTENT_STUDIO_FUNNEL_STAGES.map((s) => (
          <SelectItem key={s} value={s}>
            {formatFunnelStage(s)}
          </SelectItem>
        ))}
        {legacy ? (
          <SelectItem value={legacy}>Other: {formatFunnelStage(legacy)}</SelectItem>
        ) : null}
      </SelectContent>
    </Select>
  );
}
