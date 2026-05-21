"use client";

import { useFieldArray, Control, FieldValues } from "react-hook-form";
import { Plus, Trash2, Youtube } from "lucide-react";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MultimediaFieldArrayProps {
  control: Control<FieldValues>;
  t: (key: string) => string;
}

export function MultimediaFieldArray({
  control,
  t,
}: MultimediaFieldArrayProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "multimedia", // Changed from multimediaUrls for simplicity in schema
  });

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 items-start">
          <FormField
            control={control}
            name={`multimedia.${index}.url`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <div className="relative">
                    <Youtube
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
                      size={18}
                    />
                    <Input
                      className="pl-10"
                      placeholder={t("editForm.placeholders.multimedia")}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => remove(index)}
            className="shrink-0"
          >
            <Trash2 size={18} />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2 text-primary border-primary w-full sm:w-auto"
        onClick={() => append({ url: "" })}
      >
        <Plus className="mr-2 h-4 w-4" />
        {t("editForm.addYoutubeUrl")}
      </Button>
    </div>
  );
}
