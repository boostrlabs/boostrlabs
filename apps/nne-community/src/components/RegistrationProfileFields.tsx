const COUNTRY_CODES = ["AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AS","AT","AU","AW","AX","AZ","BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BV","BW","BY","BZ","CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CU","CV","CW","CX","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE","EG","EH","ER","ES","ET","FI","FJ","FK","FM","FO","FR","GA","GB","GD","GE","GF","GG","GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY","HK","HM","HN","HR","HT","HU","ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT","JE","JM","JO","JP","KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ","LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY","MA","MC","MD","ME","MF","MG","MH","MK","ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ","NA","NC","NE","NF","NG","NI","NL","NO","NP","NR","NU","NZ","OM","PA","PE","PF","PG","PH","PK","PL","PM","PN","PR","PS","PT","PW","PY","QA","RE","RO","RS","RU","RW","SA","SB","SC","SD","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ","TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO","TR","TT","TV","TW","TZ","UA","UG","UM","US","UY","UZ","VA","VC","VE","VG","VI","VN","VU","WF","WS","YE","YT","ZA","ZM","ZW"] as const;

const PROFESSION_OPTIONS = [
  ["nne_fam", "NNE FAM", "Fans, consumidores de música, curadores de playlists y comunidad."],
  ["artist", "Artista", "Rapero/a, cantante, intérprete o proyecto musical."],
  ["producer", "Productor/a", "Producción musical y dirección sonora."],
  ["composer", "Compositor/a", "Composición de canciones y melodías."],
  ["beatmaker", "Beatmaker", "Creación de beats e instrumentales."],
  ["engineer", "Ingeniero/a de audio", "Grabación, mezcla o mastering."],
  ["songwriter", "Songwriter / Letrista", "Escritura de canciones y letras."],
  ["dj", "DJ", "DJ, selector/a o curador/a musical."],
  ["a_and_r", "A&R", "Descubrimiento y desarrollo de talento."],
  ["manager", "Manager", "Management de artistas o proyectos."],
  ["label", "Label / Sello", "Operación o equipo de sello discográfico."],
  ["publisher", "Publishing", "Administración editorial y publishing."],
  ["videographer", "Videógrafo/a", "Grabación y producción audiovisual."],
  ["video_editor", "Editor/a de video", "Edición de videoclips y contenido."],
  ["director", "Director/a creativo/a o audiovisual", "Dirección creativa, visual o de campañas."],
  ["photographer", "Fotógrafo/a", "Fotografía musical y de contenido."],
  ["designer", "Diseñador/a gráfico/a", "Portadas, branding y piezas visuales."],
  ["3d_artist", "Artista 3D / Motion", "3D, motion graphics, animación o VFX."],
  ["content_creator", "Creador/a de contenido", "Contenido para redes y formatos digitales."],
  ["social_media", "Social Media / Community Manager", "Gestión de redes y comunidades."],
  ["marketing", "Marketing musical", "Campañas, growth y estrategia digital."],
  ["pr", "PR / Prensa", "Relaciones públicas, prensa y comunicación."],
  ["playlist_curator", "Curador/a de playlists", "Curaduría y descubrimiento de música."],
  ["promoter", "Promotor/a / Booker", "Shows, booking y promoción."],
  ["event_producer", "Productor/a de eventos", "Producción y operación de eventos."],
  ["dancer", "Bailarín/a / Coreógrafo/a", "Danza, performance y coreografía."],
  ["stylist", "Stylist / Fashion", "Styling, moda e imagen."],
  ["makeup", "Makeup / Hair", "Maquillaje, grooming y cabello."],
  ["musician", "Músico/a instrumentista", "Instrumentista de estudio o vivo."],
  ["music_business", "Music Business", "Operaciones, negocios o administración musical."],
  ["lawyer", "Legal / Music Law", "Contratos, derechos y asuntos legales."],
  ["other", "Otro", "Otra función relacionada con música y cultura."]
] as const;

const displayNames = typeof Intl !== "undefined" && "DisplayNames" in Intl
  ? new Intl.DisplayNames(["es"], { type: "region" })
  : null;

const COUNTRIES = COUNTRY_CODES
  .map((code) => displayNames?.of(code) || code)
  .filter(Boolean)
  .sort((a, b) => String(a).localeCompare(String(b), "es"));

export function RegistrationProfileFields() {
  return (
    <>
      <fieldset className="registration-professions">
        <legend>¿A qué te dedicas? <span>(selecciona todas las que apliquen)</span></legend>
        <div className="registration-profession-grid">
          {PROFESSION_OPTIONS.map(([value, label, description]) => (
            <label key={value} className="registration-profession-option">
              <input type="checkbox" name="professions" value={value} />
              <span><strong>{label}</strong><small>{description}</small></span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form-grid">
        <label>
          País donde vives actualmente
          <span> (residencia actual)</span>
          <input name="country" className="field" required list="nne-countries" autoComplete="country-name" placeholder="Empieza a escribir…" />
        </label>
        <label>
          País de origen <span>(opcional)</span>
          <input name="origin_country" className="field" list="nne-countries" placeholder="Empieza a escribir…" />
        </label>
      </div>
      <datalist id="nne-countries">
        {COUNTRIES.map((country) => <option key={country} value={String(country)} />)}
      </datalist>

      <label>Ciudad donde vives <span>(opcional)</span><input name="city" className="field" autoComplete="address-level2" /></label>
    </>
  );
}
