"use client";

import { useFieldArray, Control, FieldValues } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface TrajectoryFieldArrayProps {
  control: Control<FieldValues>;
  t: (key: string) => string;
}

export function TrajectoryFieldArray({
  control,
  t,
}: TrajectoryFieldArrayProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "trajectories",
  });

  return (
    <div className="space-y-6">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="p-4 border border-border rounded-xl relative space-y-4"
        >
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-lg text-foreground">
              Trajectory #{index + 1}
            </h4>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => remove(index)}
              className="h-8 w-8"
            >
              <Trash2 size={16} />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name={`trajectories.${index}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("editForm.trajectoryFields.title")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "editForm.trajectoryFields.placeholders.title",
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`trajectories.${index}.organization`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("editForm.trajectoryFields.organization")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "editForm.trajectoryFields.placeholders.organization",
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name={`trajectories.${index}.period`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("editForm.trajectoryFields.period")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t(
                      "editForm.trajectoryFields.placeholders.period",
                    )}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`trajectories.${index}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("editForm.trajectoryFields.description")}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t(
                      "editForm.trajectoryFields.placeholders.description",
                    )}
                    className="resize-y"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2 text-primary border-primary w-full sm:w-auto"
        onClick={() =>
          append({ title: "", organization: "", period: "", description: "" })
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        {t("editForm.addTrajectory")}
      </Button>
    </div>
  );
}
