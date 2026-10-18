# PrintCost 3D

Calculadora estática de costos y precios para impresión 3D. Está construida con HTML, CSS y JavaScript puro, sin backend, dependencias externas ni servicios de pago.

## Archivos
- `index.html`: estructura de la interfaz.
- `css/styles.css`: tema oscuro tecnológico y diseño responsive.
- `js/calculator.js`: fórmulas y validación.
- `js/storage.js`: configuración e historial en `localStorage`.
- `js/history.js`: renderizado del historial.
- `js/app.js`: interacciones de la aplicación.

## Cómo usar localmente
1. Descomprime la carpeta.
2. Abre `index.html` en un navegador moderno. Para una experiencia completa con portapapeles, es preferible usar HTTPS o un servidor local.
3. Introduce gramos, precio por kg, tiempo por pieza y cantidad.
4. Ajusta los valores habituales en **Configuración**. Se guardan en el navegador actual.
5. Guarda las cotizaciones que quieras conservar en **Historial**.

## Publicar gratis en Netlify
1. Descomprime `printcost-3d.zip`.
2. Entra en https://app.netlify.com/ e inicia sesión o crea una cuenta.
3. En el panel de Netlify, busca la opción de desplegar manualmente un sitio (Deploy manually / Netlify Drop; los nombres de la interfaz pueden cambiar).
4. Arrastra la carpeta `printcost-3d` descomprimida, que contiene `index.html`, `css/` y `js/`, o sigue el flujo de publicación manual disponible en tu panel.
5. Netlify generará una URL pública. Puedes abrirla desde el celular y la computadora.

No hace falta configurar build command ni directorio de publicación: `index.html` está en la raíz de la carpeta.

## Almacenamiento y privacidad
La configuración y el historial se guardan con `localStorage` en el navegador y dispositivo actuales. No hay cuentas ni sincronización automática. Si borras los datos del sitio/navegador, puedes perderlos. Para guardar una copia, utiliza las funciones del navegador o exporta el historial en una versión futura.

## Fórmulas y supuestos
- Filamento por pieza = gramos × precio por kg ÷ 1000.
- Electricidad por pieza = horas × (vatios ÷ 1000) × tarifa por kWh.
- Desgaste por pieza = horas × costo de desgaste por hora.
- Reserva de fallas = porcentaje de filamento + electricidad + desgaste.
- Trabajo manual por pieza = minutos ÷ 60 × tarifa por hora.
- Diseño por pieza = horas de diseño × valor por hora ÷ unidades previstas para amortizar.
- Precio sugerido = costo total por pieza × (1 + recargo ÷ 100).

Los valores predeterminados (0.90 S/kWh, 200 W, S/ 0.30/h de desgaste, 10% de reserva, S/ 10/h para tiempo manual y diseño, S/ 50/kg de filamento y 100% de recargo) son supuestos editables, no mediciones ni recomendaciones comerciales garantizadas. El costo real de electricidad depende del consumo medido y de la tarifa efectiva.

## Nota de cálculo
El formulario trata gramos, tiempo de impresión, trabajo manual y extras por pieza. El costo de extras por lote se distribuye entre la cantidad del lote. La amortización del diseño se calcula usando las unidades previstas de venta, por lo que puede ser distinta de la cantidad fabricada en la cotización actual.
