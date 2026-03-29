

## Plan: Add consent checkboxes to login/signup form

### What changes

Add two checkbox blocks to the registration form (visible only in `signupMode`):

1. **Обязательный** — «Согласие на обработку персональных данных» со ссылкой на `https://aventuramania.ru/soglasie_opd`. Блокирует кнопку регистрации если не отмечен.

2. **Необязательный** — «Согласие на получение информационных и рекламных сообщений» со ссылкой на `https://aventuramania.ru/soglasie_rassilka`.

### File: `src/pages/Login.tsx`

- Import `Checkbox` from `@/components/ui/checkbox`
- Add state: `consentPD` (boolean, default false), `consentAds` (boolean, default false)
- Reset both on mode toggle
- In signup mode, after password field, render two checkbox rows with links opening in new tab
- Disable submit button when `signupMode && !consentPD`
- Pass `consentAds` value in signup metadata (`options.data`) for future use

### UI layout (each checkbox row)

```text
[✓] Даю согласие на обработку персональных данных (ссылка) *
[ ] Согласен на получение информационных и рекламных сообщений (ссылка)
```

Links styled as `text-primary underline`, open in `_blank`.

