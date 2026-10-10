"use client";

import { useId, useMemo, useState, type ComponentProps, type ReactElement } from "react";
import { Check, ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useCountryNames } from "@/hooks/useCountryNames";
import {
  COUNTRY_CODES,
  FEATURED_HOCKEY_COUNTRIES,
  getCountryFlag,
  normalizeCountry,
  sortCountriesByName,
} from "@/lib/countries";
import { cn } from "@/lib/utils";

const ANY_VALUE = "__any__";

// Same look as SelectTrigger / SelectItem so the combobox sits next to selects
const TRIGGER_CLASS =
  "border-input data-placeholder:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0";
const ITEM_CLASS =
  "data-[selected=true]:bg-primary data-[selected=true]:text-white-black cursor-pointer";

/** Lowercase, accents removed: "España" and "espana" match. */
function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

function matchCountry(value: string, search: string, keywords?: string[]): number {
  // "All countries" is not a search result (its label contains "es", "tr"...)
  if (value === ANY_VALUE) return 0;
  const haystack = fold([value, ...(keywords ?? [])].join(" "));
  return haystack.includes(fold(search)) ? 1 : 0;
}

export interface CountryTriggerState {
  /** Translated name (or legacy text) of the value, null when empty. */
  label: string | null;
  flag: string | null;
  open: boolean;
}

export interface CountrySelectProps
  extends Omit<ComponentProps<"button">, "value" | "onChange" | "children"> {
  /** ISO code (any case); legacy free text is shown as it is. */
  value?: string | null;
  /** Receives the uppercase code, or null for the "all countries" option. */
  onChange: (code: string | null) => void;
  /** Codes to offer; defaults to every code the API accepts. */
  options?: readonly string[];
  /** Filter mode: adds a first option with this label that clears the value. */
  allLabel?: string;
  placeholder?: string;
  /**
   * Custom trigger (e.g. a filter chip). Must render a single button; the
   * button props of this component (id, aria-*) are not applied to it.
   */
  renderTrigger?: (state: CountryTriggerState) => ReactElement;
}

export function CountrySelect({
  value,
  onChange,
  options,
  allLabel,
  placeholder,
  renderTrigger,
  className,
  ...triggerProps
}: CountrySelectProps) {
  const t = useTranslations("countries");
  const { nameOf } = useCountryNames();
  const [open, setOpen] = useState(false);
  const contentId = useId();

  const label = value?.trim() ? nameOf(value) : null;
  const flag = getCountryFlag(value);

  const select = (code: string | null) => {
    onChange(code);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {renderTrigger ? (
          renderTrigger({ label, flag, open })
        ) : (
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={contentId}
            data-placeholder={label ? undefined : ""}
            className={cn(TRIGGER_CLASS, className)}
            {...triggerProps}
          >
            <span className="truncate">
              {label ? (
                <>
                  {flag && <span aria-hidden="true">{flag} </span>}
                  {label}
                </>
              ) : (
                (allLabel ?? placeholder ?? t("select"))
              )}
            </span>
            <ChevronDownIcon className="size-4 opacity-50" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        id={contentId}
        aria-label={t("search")}
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-64 p-0"
      >
        <CountryCommand
          value={normalizeCountry(value)}
          options={options}
          allLabel={allLabel}
          onSelect={select}
        />
      </PopoverContent>
    </Popover>
  );
}

interface CountryCommandProps {
  value: string | null;
  options?: readonly string[];
  allLabel?: string;
  onSelect: (code: string | null) => void;
}

/** Only mounted while the popover is open, so names are built on demand. */
function CountryCommand({ value, options, allLabel, onSelect }: CountryCommandProps) {
  const t = useTranslations("countries");
  const { locale, homeNationNames, nameOf } = useCountryNames();

  const { featured, others } = useMemo(() => {
    const offered = new Set(options ?? COUNTRY_CODES);
    const featuredSet = new Set(FEATURED_HOCKEY_COUNTRIES);
    return {
      featured: sortCountriesByName(
        FEATURED_HOCKEY_COUNTRIES.filter((code) => offered.has(code)),
        locale,
        homeNationNames,
      ),
      others: sortCountriesByName(
        [...offered].filter((code) => !featuredSet.has(code)),
        locale,
        homeNationNames,
      ),
    };
  }, [options, locale, homeNationNames]);

  const renderItem = (code: string) => (
    <CommandItem
      key={code}
      value={code}
      keywords={[nameOf(code)]}
      onSelect={() => onSelect(code)}
      className={ITEM_CLASS}
    >
      <span aria-hidden="true">{getCountryFlag(code)}</span>
      {nameOf(code)}
      <Check className={cn("ml-auto", code === value ? "opacity-100" : "opacity-0")} />
    </CommandItem>
  );

  return (
    <Command filter={matchCountry} label={t("search")}>
      <CommandInput placeholder={t("search")} />
      <CommandList>
        <CommandEmpty>{t("empty")}</CommandEmpty>
        {allLabel && (
          <CommandGroup>
            <CommandItem
              value={ANY_VALUE}
              keywords={[allLabel]}
              onSelect={() => onSelect(null)}
              className={ITEM_CLASS}
            >
              {allLabel}
              <Check className={cn("ml-auto", value ? "opacity-0" : "opacity-100")} />
            </CommandItem>
          </CommandGroup>
        )}
        {featured.length > 0 && (
          <CommandGroup heading={t("featured")}>{featured.map(renderItem)}</CommandGroup>
        )}
        {others.length > 0 && (
          <CommandGroup heading={t("others")}>{others.map(renderItem)}</CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
