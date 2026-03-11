export default function PersonalLetter() {
  return (
    <section className="py-16 md:py-24 px-4 bg-brand-cream">
      <div className="max-w-[720px] mx-auto">
        <div
          className="font-body text-[1.05rem] md:text-[1.15rem] leading-[2.1rem] md:leading-[2.3rem] text-brand-black/85 space-y-0 italic"
          style={{
            backgroundImage: "repeating-linear-gradient(transparent, transparent 2.05rem, rgba(180,160,130,0.2) 2.05rem, rgba(180,160,130,0.2) 2.1rem)",
            backgroundSize: "100% 2.1rem",
            backgroundPositionY: "0.95rem",
          }}
        >
          {/* TODO: Pas deze brief aan naar jouw organisatie en donatieactie */}
          <p className="font-semibold not-italic text-brand-black text-[1.15rem] md:text-[1.25rem] pb-1">
            {"Beste supporters,"}
          </p>

          <p>
            {"Wij hebben jullie hulp nodig. Al lange tijd werken we aan ons doel, en we zijn er bijna. Maar zonder jullie steun lukt het niet."}
          </p>

          <p>
            {"Met deze donatieactie willen we het laatste stuk financieren. Elke bijdrage, groot of klein, brengt ons dichter bij ons doel. Het maakt niet uit of je \u20AC5 of \u20AC500 doneert \u2014 samen maken we het verschil."}
          </p>

          <p>
            {"Doneren is eenvoudig via Tikkie. Kies een bedrag, vul eventueel je naam in, en rond de betaling af. Binnen een paar klikken heb je bijgedragen aan iets moois."}
          </p>

          <p className="font-semibold">
            {"Doe mee, deel deze actie met je netwerk, en laten we samen ons doel bereiken!"}
          </p>

          <div className="pt-4 border-t border-brand-primary/30 mt-6 not-italic" style={{ backgroundImage: "none" }}>
            <p className="font-bold text-brand-primary text-[1.25rem] md:text-[1.35rem]">
              {"Samen maken we het mogelijk."}
            </p>
            <p className="text-brand-muted mt-2 font-body text-base">
              {"Namens het team, Uw Organisatie"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
