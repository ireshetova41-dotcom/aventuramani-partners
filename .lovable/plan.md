

## Plan: Add PDF downloads, program links, and prices to tour cards

### What changes

**1. Copy PDF files to `public/tours/`** so they're downloadable via direct URL:
- `Камчатка_2026_4.pdf` → `public/tours/kamchatka.pdf`
- `Байкал_и_Саяны_1.pdf` → `public/tours/baikal.pdf`
- `Сахалин_2026.pdf` → `public/tours/sakhalin.pdf`
- `преза_Южный_Китай_2026_2.pdf` → `public/tours/china.pdf`

Note: no PDF for Altai was provided — that tour will not have download/link buttons.

**2. Update tour data in `Dashboard.tsx`**

Add fields to each tour object:
- `price` — цена за человека (100 ₽ для всех)
- `pdfUrl` — path to downloadable PDF in `/tours/`
- `programUrl` — external link to view the program online

Links mapping:
| Tour | Program Link |
|------|-------------|
| Камчатка | https://online.flippingbook.com/view/757254969/ |
| Байкал | https://t.me/c/1579658397/28166 |
| Сахалин | https://online.flippingbook.com/view/144259978/ |
| Южный Китай | https://online.flippingbook.com/view/363094287/ |
| Алтай | нет данных |

**3. Update tour card UI**

Each card will show:
- Price block: "100 ₽ / чел." displayed prominently
- Two action buttons above "Хочу продавать":
  - **Скачать PDF** — downloads the PDF file (icon: `Download`)
  - **Смотреть программу** — opens external link in new tab (icon: `ExternalLink`)
- Both buttons shown only when the tour has the corresponding data

### Technical details

- Files in `public/tours/` are served as static assets — no storage bucket needed
- PDF download uses `<a href="/tours/kamchatka.pdf" download>` wrapped in a Button
- Program link uses `<a href="..." target="_blank" rel="noopener">`
- Add `Download` and `ExternalLink` icons from lucide-react

### File changes

| File | Change |
|------|--------|
| `public/tours/` | 4 new PDF files |
| `src/pages/Dashboard.tsx` | Update tours array + card rendering |

