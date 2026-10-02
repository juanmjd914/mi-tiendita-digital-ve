// Ordenar se aplica al cambiar el selector, sin tener que tocar "Aplicar".
document.querySelectorAll('[data-autosubmit]').forEach((el) => {
  el.addEventListener('change', () => el.form?.submit())
})
