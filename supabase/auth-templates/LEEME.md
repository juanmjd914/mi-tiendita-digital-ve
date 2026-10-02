# Plantillas de correo de Supabase Auth (español, estilo Obsidian Jade)

Se pegan en Supabase → Authentication → Emails (Templates). En cada una: copiar el **asunto** y pegar el **HTML** completo del archivo en "Message body".

| Plantilla en Supabase | Asunto | Archivo |
|---|---|---|
| Confirm signup | Confirma tu cuenta en Mi Tiendita Digital Ve | `1-confirmar-cuenta.html` |
| Reset password | Crea una nueva contraseña — Mi Tiendita Digital Ve | `2-recuperar-contrasena.html` |
| Change email address | Confirma tu nuevo correo — Mi Tiendita Digital Ve | `3-cambio-de-correo.html` |

Variables de Supabase usadas: `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`.

**URL Configuration** (Authentication → URL Configuration):
- Site URL: `https://mitienditadigitalve.com`
- Redirect URLs: `https://mitienditadigitalve.com/**` y `http://localhost:3001/**`
