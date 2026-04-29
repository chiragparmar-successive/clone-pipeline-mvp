export type HeroSection = {
  __component: "sections.hero";
  id: number;
  headline: string;
  subheadline?: string | null;
  ctaText?: string | null;
  ctaHref?: string | null;
  imageUrl?: string | null;
};

export type ContentBlockSection = {
  __component: "sections.content-block";
  id: number;
  heading?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  alignment?: "left" | "center" | "right" | null;
};

export type CtaSection = {
  __component: "sections.cta";
  id: number;
  heading: string;
  body?: string | null;
  buttonText?: string | null;
  buttonHref?: string | null;
};

export type Section = HeroSection | ContentBlockSection | CtaSection;

export type Seo = {
  metaTitle?: string | null;
  metaDescription?: string | null;
};

export type Page = {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  seo?: Seo | null;
  sections?: Section[] | null;
};
