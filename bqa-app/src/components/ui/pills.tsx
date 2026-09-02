import { cn } from "@/lib/utils";

export function Pills({
  name,
  options,
  defaultOption,
  value,
  onChange,
  className,
}: {
  name: string;
  options: string[];
  defaultOption?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isChecked = value !== undefined ? value === option : option === defaultOption;
        return (
          <label
            key={option}
            className="cursor-pointer rounded-xl border border-line bg-card px-3.5 py-2 text-[13px] font-semibold text-muted-foreground transition-all duration-200 has-checked:border-primary has-checked:bg-primary-soft has-checked:text-primary-dark has-checked:shadow-soft hover:border-primary/40"
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value !== undefined ? isChecked : undefined}
              defaultChecked={value === undefined ? isChecked : undefined}
              onChange={(e) => {
                if (e.target.checked && onChange) {
                  onChange(option);
                }
              }}
              className="pointer-events-none absolute opacity-0"
            />
            {option}
          </label>
        );
      })}
    </div>
  );
}

export function CheckPills({
  options,
  defaultSelected = [],
  className,
}: {
  options: string[];
  defaultSelected?: string[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <label
          key={option}
          className="cursor-pointer rounded-xl border border-line bg-card px-3.5 py-2 text-[13px] font-semibold text-muted-foreground transition-all duration-200 has-checked:border-primary has-checked:bg-primary-soft has-checked:text-primary-dark has-checked:shadow-soft hover:border-primary/40"
        >
          <input
            type="checkbox"
            value={option}
            defaultChecked={defaultSelected.includes(option)}
            className="pointer-events-none absolute opacity-0"
          />
          {option}
        </label>
      ))}
    </div>
  );
}
