"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Check, ChevronsUpDown, X } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date-utils";
import { useCreateNewsArticle, useSuperAdminNews, useUpdateNewsArticle, usePublishNewsArticle } from "@/hooks/useAdminNews";
import { AdminNewsArticle, NewsArticleInput } from "@/types/models/admin";
import { NewsCategory } from "@/hooks/useNews";

const CATEGORIES: NewsCategory[] = ["INTERNATIONAL", "NATIONAL", "TRANSFERS", "EQUIPMENT", "RESULTS"];

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const createNewsFormSchema = (t: (key: string) => string) =>
  z.object({
    title: z.string().min(3, { message: t("form.validation.titleMin") }),
    slug: z
      .string()
      .min(3, { message: t("form.validation.slugMin") })
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: t("form.validation.slugFormat") }),
    excerpt: z
      .string()
      .min(10, { message: t("form.validation.excerptMin") })
      .max(280, { message: t("form.validation.excerptMax") }),
    content: z.string().min(20, { message: t("form.validation.contentMin") }),
    coverImage: z
      .string()
      .url({ message: t("form.validation.urlInvalid") })
      .optional()
      .or(z.literal("")),
    category: z.enum(["INTERNATIONAL", "NATIONAL", "TRANSFERS", "EQUIPMENT", "RESULTS"]),
    publishedAt: z.string().optional(),
    readingTimeMinutes: z.coerce.number().min(0).optional(),
    author: z.object({
      name: z.string().optional(),
      avatar: z
        .string()
        .url({ message: t("form.validation.urlInvalid") })
        .optional()
        .or(z.literal("")),
    }),
    relatedArticleIds: z.array(z.string()).optional(),
  });

type NewsFormValues = z.infer<ReturnType<typeof createNewsFormSchema>>;

interface NewsArticleFormProps {
  article?: AdminNewsArticle;
  mode: "create" | "edit";
}

export function NewsArticleForm({ article, mode }: NewsArticleFormProps) {
  const t = useTranslations("admin.news");
  const router = useRouter();
  const locale = useLocale();
  const localePrefix = locale === "en" ? "" : `/${locale}`;

  const [slugTouched, setSlugTouched] = useState(Boolean(article));
  const [relatedOpen, setRelatedOpen] = useState(false);

  const createMutation = useCreateNewsArticle();
  const updateMutation = useUpdateNewsArticle();
  const publishMutation = usePublishNewsArticle();
  const { data: relatedData } = useSuperAdminNews(undefined, 1, 50);

  const candidates = useMemo(
    () => (relatedData?.superAdminNewsArticles.items ?? []).filter((a) => a.id !== article?.id),
    [relatedData, article?.id]
  );

  const schema = createNewsFormSchema(t);
  const form = useForm<NewsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: article?.title ?? "",
      slug: article?.slug ?? "",
      excerpt: article?.excerpt ?? "",
      content: article?.content ?? "",
      coverImage: article?.coverImage ?? "",
      category: (article?.category as NewsCategory) ?? "NATIONAL",
      publishedAt: article?.publishedAt ?? "",
      readingTimeMinutes: article?.readingTimeMinutes ?? undefined,
      author: {
        name: article?.author?.name ?? "Stick Transfer",
        avatar: article?.author?.avatar ?? "",
      },
      relatedArticleIds: article?.relatedArticles?.map((a) => a.id) ?? [],
    },
  });

  const titleValue = form.watch("title");
  useEffect(() => {
    if (!slugTouched) {
      form.setValue("slug", slugify(titleValue), { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleValue, slugTouched]);

  const excerptValue = form.watch("excerpt") ?? "";
  const publishedAtValue = form.watch("publishedAt");
  const relatedArticleIds = form.watch("relatedArticleIds") ?? [];

  const isSaving = createMutation.isPending || updateMutation.isPending || publishMutation.isPending;

  async function submit(values: NewsFormValues, shouldPublish: boolean) {
    const input: NewsArticleInput = {
      slug: values.slug,
      title: values.title,
      excerpt: values.excerpt,
      content: values.content,
      coverImage: values.coverImage || undefined,
      category: values.category,
      publishedAt: values.publishedAt || undefined,
      readingTimeMinutes: values.readingTimeMinutes,
      author: {
        name: values.author.name || undefined,
        avatar: values.author.avatar || undefined,
      },
      relatedArticleIds: values.relatedArticleIds,
    };

    try {
      let articleId = article?.id;
      if (mode === "edit" && article) {
        await updateMutation.mutateAsync({ id: article.id, input });
      } else {
        const created = await createMutation.mutateAsync(input);
        articleId = created.createNewsArticle.id;
      }

      if (shouldPublish && articleId) {
        await publishMutation.mutateAsync({ id: articleId });
      }

      router.push(`${localePrefix}/admin/news`);
    } catch {
      // toasts handled inside mutation hooks
    }
  }

  const toggleRelated = (id: string) => {
    const current = form.getValues("relatedArticleIds") ?? [];
    const next = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
    form.setValue("relatedArticleIds", next, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("form.contentSection")}</CardTitle>
            <CardDescription>{t("form.contentSectionDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.title")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.slug")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        setSlugTouched(true);
                        field.onChange(slugify(e.target.value));
                      }}
                    />
                  </FormControl>
                  <FormDescription>{t("form.slugHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.excerpt")}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormMessage />
                    <span className="text-xs text-foreground-muted">{excerptValue.length}/280</span>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.content")}</FormLabel>
                  <FormControl>
                    <Textarea rows={12} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("form.metaSection")}</CardTitle>
            <CardDescription>{t("form.metaSectionDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.category")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {t(`categories.${category}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="readingTimeMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.readingTime")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.coverImage")}</FormLabel>
                  <FormControl>
                    <Input placeholder="https://…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="publishedAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t("form.publishDate")}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal", !field.value && "text-foreground-muted")}
                        >
                          <CalendarIcon className="size-4" />
                          {publishedAtValue ? formatDate(publishedAtValue, "en") : t("form.publishDatePlaceholder")}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? date.toISOString() : "")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>{t("form.publishDateHint")}</FormDescription>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="author.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.authorName")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="author.avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.authorAvatar")}</FormLabel>
                    <FormControl>
                      <Input placeholder="https://…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormItem>
              <FormLabel>{t("form.relatedArticles")}</FormLabel>
              <Popover open={relatedOpen} onOpenChange={setRelatedOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between font-normal">
                    {relatedArticleIds.length > 0
                      ? t("form.relatedArticlesCount", { count: relatedArticleIds.length })
                      : t("form.relatedArticlesPlaceholder")}
                    <ChevronsUpDown className="size-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t("form.relatedArticlesSearch")} />
                    <CommandList>
                      <CommandEmpty>{t("form.relatedArticlesEmpty")}</CommandEmpty>
                      <CommandGroup>
                        {candidates.map((candidate) => {
                          const selected = relatedArticleIds.includes(candidate.id);
                          return (
                            <CommandItem key={candidate.id} onSelect={() => toggleRelated(candidate.id)}>
                              <Check className={cn("size-4", selected ? "opacity-100" : "opacity-0")} />
                              <span className="truncate">{candidate.title}</span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {relatedArticleIds.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {relatedArticleIds.map((id) => {
                    const candidate = candidates.find((c) => c.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="gap-1">
                        {candidate?.title ?? id}
                        <button type="button" onClick={() => toggleRelated(id)} aria-label={t("form.removeRelated")}>
                          <X className="size-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </FormItem>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`${localePrefix}/admin/news`)}
            disabled={isSaving}
          >
            {t("form.cancel")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={form.handleSubmit((values) => submit(values, false))}
            disabled={isSaving}
          >
            {t("form.saveDraft")}
          </Button>
          <Button type="button" onClick={form.handleSubmit((values) => submit(values, true))} disabled={isSaving}>
            {t("form.publish")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
