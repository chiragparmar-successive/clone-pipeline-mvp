import type { Schema, Struct } from '@strapi/strapi';

export interface SectionsContentBlock extends Struct.ComponentSchema {
  collectionName: 'components_sections_content_blocks';
  info: {
    description: 'Heading + body copy block';
    displayName: 'ContentBlock';
  };
  attributes: {
    alignment: Schema.Attribute.Enumeration<['left', 'center', 'right']> &
      Schema.Attribute.DefaultTo<'left'>;
    body: Schema.Attribute.Text;
    heading: Schema.Attribute.String;
    imageUrl: Schema.Attribute.String;
  };
}

export interface SectionsCta extends Struct.ComponentSchema {
  collectionName: 'components_sections_ctas';
  info: {
    description: 'Call-to-action band';
    displayName: 'Cta';
  };
  attributes: {
    body: Schema.Attribute.Text;
    buttonHref: Schema.Attribute.String;
    buttonText: Schema.Attribute.String;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsHero extends Struct.ComponentSchema {
  collectionName: 'components_sections_heroes';
  info: {
    description: 'Hero banner with headline and CTA';
    displayName: 'Hero';
  };
  attributes: {
    ctaHref: Schema.Attribute.String;
    ctaText: Schema.Attribute.String;
    headline: Schema.Attribute.String & Schema.Attribute.Required;
    imageUrl: Schema.Attribute.String;
    subheadline: Schema.Attribute.Text;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seo';
  info: {
    description: 'SEO metadata';
    displayName: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text;
    metaTitle: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'sections.content-block': SectionsContentBlock;
      'sections.cta': SectionsCta;
      'sections.hero': SectionsHero;
      'shared.seo': SharedSeo;
    }
  }
}
