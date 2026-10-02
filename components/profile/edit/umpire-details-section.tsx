"use client";

import type { Control } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  UmpireLicenseLevel,
  TravelAvailability,
  UmpireModality,
  UmpireCategory,
} from "@/types/enums";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyControl = Control<any>;

const SELECT_CLASS =
  "w-full h-9 rounded-md border border-input bg-background text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer";

interface SectionProps {
  control: AnyControl;
  /** `profile` namespace translator. */
  t: (key: string) => string;
  /** `umpire` namespace translator (enum labels shared with profile/explore). */
  tUmpire: (key: string) => string;
}

/** Licence, experience, availability, modalities and categories of an umpire. */
export function UmpireDetailsSection({ control, t, tUmpire }: SectionProps) {
  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle>{t("editForm.umpire.title")}</CardTitle>
        <CardDescription>{t("editForm.umpire.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="licenseLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("editForm.umpire.licenseLevel")}</FormLabel>
                <FormControl>
                  <select {...field} className={SELECT_CLASS}>
                    <option value="">{t("editForm.umpire.select")}</option>
                    {Object.values(UmpireLicenseLevel).map((level) => (
                      <option key={level} value={level}>
                        {tUmpire(`licenseLevels.${level}`)}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="certifyingBody"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("editForm.umpire.certifyingBody")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("editForm.umpire.placeholders.certifyingBody")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="licenseNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("editForm.umpire.licenseNumber")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  {t("editForm.umpire.licenseNumberHint")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="certificationYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("editForm.umpire.certificationYear")}</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="2018" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="yearsOfExperience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("editForm.yearsOfExperience")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t("editForm.placeholders.yearsOfExperience")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="matchesOfficiated"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("editForm.umpire.matchesOfficiated")}</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="120" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="travelAvailability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("editForm.umpire.travelAvailability")}</FormLabel>
                <FormControl>
                  <select {...field} className={SELECT_CLASS}>
                    <option value="">{t("editForm.umpire.select")}</option>
                    {Object.values(TravelAvailability).map((option) => (
                      <option key={option} value={option}>
                        {tUmpire(`travelAvailability.${option}`)}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="languages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("editForm.umpire.languages")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("editForm.umpire.placeholders.languages")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("editForm.umpire.languagesHint")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <CheckboxGroupField
          control={control}
          name="modalities"
          legend={t("editForm.umpire.modalities")}
          options={Object.values(UmpireModality).map((value) => ({
            value,
            label: tUmpire(`modalities.${value}`),
          }))}
        />
        <CheckboxGroupField
          control={control}
          name="umpireCategories"
          legend={t("editForm.umpire.categories")}
          options={Object.values(UmpireCategory).map((value) => ({
            value,
            label: tUmpire(`categories.${value}`),
          }))}
        />
      </CardContent>
    </Card>
  );
}

interface CheckboxGroupFieldProps {
  control: AnyControl;
  name: string;
  legend: string;
  options: { value: string; label: string }[];
}

function CheckboxGroupField({
  control,
  name,
  legend,
  options,
}: CheckboxGroupFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selected: string[] = field.value ?? [];
        const toggle = (value: string, checked: boolean) =>
          field.onChange(
            checked ? [...selected, value] : selected.filter((v) => v !== value),
          );

        return (
          <FormItem>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{legend}</legend>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="accent-primary cursor-pointer"
                      checked={selected.includes(option.value)}
                      onChange={(e) => toggle(option.value, e.target.checked)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

/** Editable list of licences/courses; saved as a whole (backend replaces the list). */
export function UmpireCertificationsSection({ control, t }: Omit<SectionProps, "tUmpire">) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "umpireCertifications",
  });

  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle>{t("editForm.umpire.certifications.title")}</CardTitle>
        <CardDescription>
          {t("editForm.umpire.certifications.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((item, index) => (
          <div
            key={item.id}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-md border border-input p-4"
          >
            <FormField
              control={control}
              name={`umpireCertifications.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("editForm.umpire.certifications.name")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`umpireCertifications.${index}.issuer`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("editForm.umpire.certifications.issuer")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`umpireCertifications.${index}.issuedAt`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("editForm.umpire.certifications.issuedAt")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`umpireCertifications.${index}.fileUrl`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("editForm.umpire.certifications.fileUrl")}</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="md:col-span-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
              >
                <Trash2 className="w-4 h-4 mr-1 text-error" />
                {t("editForm.umpire.certifications.remove")}
              </Button>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({ name: "", issuer: "", issuedAt: "", fileUrl: "" })
          }
        >
          <Plus className="w-4 h-4 mr-1" />
          {t("editForm.umpire.certifications.add")}
        </Button>
      </CardContent>
    </Card>
  );
}
