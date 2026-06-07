import Script from 'next/script'

interface JsonLdProps {
  data: Record<string, unknown>
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// WebSite structured data
export function WebsiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PandaHan',
    alternateName: 'PandaHan',
    url: 'https://pandahan.xyz',
    description: '为海外华裔儿童打造的中文分级阅读平台',
    inLanguage: ['zh-CN', 'en'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://pandahan.xyz/reading?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return <JsonLd data={data} />
}

// WebPage structured data
export function WebPageJsonLd({
  title,
  description,
  url,
  lastReviewed,
}: {
  title: string
  description: string
  url: string
  lastReviewed?: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: description,
    url: url,
    inLanguage: 'zh-CN',
    isPartOf: {
      '@type': 'WebSite',
      name: 'PandaHan',
      url: 'https://pandahan.xyz',
    },
    ...(lastReviewed && { lastReviewed }),
  }

  return <JsonLd data={data} />
}

// Article structured data
export function ArticleJsonLd({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  author = 'PandaHan',
  keywords = [],
}: {
  title: string
  description: string
  url: string
  image?: string
  datePublished?: string
  dateModified?: string
  author?: string
  keywords?: string[]
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    url: url,
    image: image || 'https://pandahan.xyz/images/og-image.png',
    datePublished: datePublished || new Date().toISOString(),
    dateModified: dateModified || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: author,
      url: 'https://pandahan.xyz',
    },
    publisher: {
      '@type': 'Organization',
      name: 'PandaHan',
      logo: {
        '@type': 'ImageObject',
        url: 'https://pandahan.xyz/favicon.svg',
      },
    },
    inLanguage: 'zh-CN',
    keywords: keywords.join(', '),
  }

  return <JsonLd data={data} />
}

// EducationalOrganization structured data
export function EducationalOrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'PandaHan',
    alternateName: 'PandaHan',
    url: 'https://pandahan.xyz',
    description: '为海外华裔儿童提供中文分级阅读学习的自学工具平台',
    areaServed: 'Worldwide',
    audience: {
      '@type': 'Audience',
      audienceType: 'Overseas Chinese children and families',
    },
    logo: 'https://pandahan.xyz/favicon.svg',
    sameAs: [
      // Add social media links when available
      // 'https://twitter.com/pandahanxyz',
      // 'https://facebook.com/pandahanxyz',
    ],
  }

  return <JsonLd data={data} />
}

// BreadcrumbList structured data
export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <JsonLd data={data} />
}
