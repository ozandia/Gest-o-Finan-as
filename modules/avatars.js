/**
 * Gestão Financeira - Módulo de Avatares Ilustrados para Ju e Ozi
 * Opções estilizadas em Alta Resolução (HD)
 */

export const AVATARS = {
  ju: `
    <div class="avatar-img-wrapper ju-wrapper">
      <img src="assets/avatar_ju.jpg" alt="Ju - Mulher Cabelo Escuro" class="avatar-img" onerror="this.outerHTML='<span class=\\'avatar-fallback ju\\'>👩🏻</span>'">
    </div>
  `,

  ozi: `
    <div class="avatar-img-wrapper ozi-wrapper">
      <img src="assets/avatar_ozi.jpg" alt="Ozi - Mulher Cabelo Castanho Enrolado" class="avatar-img" onerror="this.outerHTML='<span class=\\'avatar-fallback ozi\\'>👩🏽‍🦱</span>'">
    </div>
  `,

  ambos: `
    <div class="avatar-img-wrapper ambos-wrapper">
      <div class="avatar-dual-badge">
        <img src="assets/avatar_ju.jpg" alt="Ju" class="dual-avatar-img left" onerror="this.style.display='none'">
        <img src="assets/avatar_ozi.jpg" alt="Ozi" class="dual-avatar-img right" onerror="this.style.display='none'">
      </div>
    </div>
  `
};
