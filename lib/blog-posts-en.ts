/** Blog yazılarının İngilizcesi (lib/blog-posts.ts ile aynı slug'lar; slug, kategori adresi ve tarih ISO'su Türkçe kaynaktan gelir) */
import type { BlogPost } from './blog-posts'

export type BlogPostEn = Pick<BlogPost, 'title' | 'category' | 'readTime' | 'date' | 'desc' | 'content'>

export const BLOG_POSTS_EN: Record<string, BlogPostEn> = {
  'ev-sarj-istasyonu-secimi': {
    title: 'How to Choose a Home EV Charger',
    category: 'EV Charging',
    readTime: '6 min',
    date: 'April 12, 2025',
    desc: 'AC vs. DC charging, power levels and how to match a charger to your home’s electrical installation.',
    content: `
Once you own an electric vehicle, the first question that comes to mind is usually: "How do I charge it at home?" With the trips to the gas station gone, you need something to take their place. Choosing the right charger has a direct impact on both your everyday convenience and your long-term savings.

**AC or DC — the real difference**

Home charging stations fall into two main categories. AC (alternating current) chargers feed grid power straight to the vehicle’s onboard charger, running quietly and economically — ideal for home use. DC (direct current) chargers handle the conversion internally and deliver current directly to the battery. With power ratings from 50 kW to 350 kW, they belong to the world of commercial rapid charging; for a home installation they are both unnecessary and disproportionately expensive.

**Which power level suits a home?**

For most EV owners, a 7.4 kW single-phase charger is the sweet spot. It runs on a dedicated 230V / 32A circuit, fills an empty battery in 6–8 hours and fits easily into an overnight charging routine: you wake up to a fully charged car. If you have a three-phase supply, stepping up to 11 kW cuts charging time to 3–4 hours. If your vehicle’s onboard charger supports 22 kW, that model gives you the fastest home charging possible; if it doesn’t, there is no point paying extra.

Always have your home’s electrical installation assessed before installing a charger. A 7.4 kW unit needs a dedicated 32A circuit. The length of the cable run from the electrical panel to the charger has a direct effect on cost. And proper grounding is a non-negotiable requirement for safe charging.

**Smart features pay off in the long run**

Modern chargers do more than just charge. Off-peak (night) rate support lets you take advantage of unit prices well below the daytime rate, and the annual savings add up to a substantial amount. Wi-Fi connectivity and mobile app integration let you monitor charging remotely and set schedules. For outdoor installations, choose an ingress protection rating of IP54 or higher; tethered models (with a fixed cable) are more practical, sparing you the hassle of plugging and unplugging a cable every day.

If you want a future-proof choice, OCPP support is an important detail. This open protocol opens the door to integrating your charger with smart home automation systems or other management platforms further down the line.

- Single-phase, 7.4 kW: The most common and practical option
- Three-phase, 11 kW: For drivers who cover long distances every day
- 22 kW: Only worthwhile if your vehicle supports it
- IP54+: Essential for outdoor installation
- OCPP support: Long-term investment protection

All in all, a 7.4 kW AC charger remains the most balanced choice for most users: reasonable cost, simple installation and more than enough charging speed for daily use.
    `,
  },
  'gunes-paneli-verimlilik': {
    title: 'How to Calculate Solar Panel Efficiency',
    category: 'Solar Energy',
    readTime: '8 min',
    date: 'April 5, 2025',
    desc: 'Panel power, annual yield estimates and payback period, plus the differences between monocrystalline and polycrystalline panels.',
    content: `
Before investing in solar panels, you need a clear answer to two questions: how much will this system actually produce, and when will it pay for itself? Getting the calculation right keeps you from paying for capacity you don’t need — or settling for a system that falls short.

**What do efficiency ratings mean?**

The efficiency percentage you see on panel datasheets is measured under Standard Test Conditions (STC): 1,000 W/m² of irradiance at a temperature of 25°C. Today’s monocrystalline panels deliver 19–23% efficiency, while bifacial (double-sided) models can push this up to 25%. The higher the figure, the more electricity you can generate from the same roof area.

**Calculating annual production**

Türkiye is exceptionally well placed for solar energy. Daily peak sun hours range from 3.5–4 hours on the Black Sea coast up to 5.5–6.5 hours in the Mediterranean and Aegean regions. The calculation is based on this formula: Panel Power (kWp) × Daily Peak Sun Hours × 365 × 0.85 system efficiency = Annual Production (kWh). In Ankara, a 10 kWp system produces roughly 15,000 kWh a year — enough to cover the total consumption of a three-unit apartment building.

| Feature | Monocrystalline | Polycrystalline |
|---------|-----------------|-----------------|
| Efficiency | 19–23% | 15–18% |
| Heat tolerance | Good | Moderate |
| Roof space efficiency | High | Moderate |
| Lifespan | 25–30 years | 20–25 years |

If roof space is limited, monocrystalline is the clear winner. On large plots of land, polycrystalline lowers the upfront cost; over the long run, however, monocrystalline’s better temperature coefficient and longer lifespan change the equation.

**Factors that reduce efficiency — and how to counter them**

In Türkiye, a tilt angle of 30–35° and a south-facing orientation are the basic requirements. Shading is the biggest enemy: even a single shaded cell affects the whole panel, so the distance to chimneys, neighboring buildings and trees must be assessed carefully before installation. Every 1°C rise in temperature reduces efficiency by around 0.4% — ventilated mounting keeps this loss to a minimum. Cleaning the panels once or twice a year can increase output by 5–10%.

**Calculating your return on investment**

As of 2025, a 10 kWp system costs ₺180,000–250,000 to install. With annual electricity savings of ₺35,000–50,000, the payback period comes to 4–7 years. Given the panels’ 25–30-year economic life, the remaining 18–25 years are pure net profit. In an inflationary environment, the upward trend in electricity prices tips the balance even further in your favor.

In short, to size your solar investment correctly, start with your consumption, then look at your roof area and the peak sun hours in your region. After that, the numbers speak for themselves.
    `,
  },
  'lityum-vs-kursum-asit': {
    title: 'Lithium or Lead-Acid? A Complete Battery Comparison',
    category: 'Batteries',
    readTime: '7 min',
    date: 'March 28, 2025',
    desc: 'Lithium LiFePO4 vs. lead-acid batteries compared on price, lifespan, depth of discharge and use cases.',
    content: `
When you set up an energy storage system, choosing the battery is often the most critical — and most often postponed — decision. There are two options on the shelf: lead-acid, tempting with its low upfront price, and lithium LiFePO4, which looks expensive at first glance but changes the equation over the long term. Which one is really the better investment?

**Usable capacity: not what it seems on paper**

Datasheet figures can be misleading. A 100 Ah lead-acid battery, limited to a maximum depth of discharge of 50%, gives you only 50 Ah of usable capacity. Go beyond that and its service life drops rapidly. With a LiFePO4 battery of the same capacity, this figure rises to 80–90%. The practical result: at the same Ah rating, a lithium battery delivers roughly 1.7 times more energy than lead-acid in real-world use. Before you buy, look at the usable energy, not the Ah rating.

| Feature | Lithium LiFePO4 | Lead-Acid (AGM/GEL) |
|---------|-----------------|---------------------|
| Usable capacity | 80–90% | 50% |
| Cycle life | 3,000–6,000 | 500–1,000 |
| Weight (100 Ah, 12V) | ~12 kg | ~25 kg |
| Charge rate | High (1C) | Low (0.2C) |
| Maintenance | None | Periodic |
| Safety | Very high | Moderate |

**The 10-year cost reality**

Calculate 10 years of use for a 5 kWh storage target and the picture becomes clear. Lead-acid is cheaper to install initially, but it needs replacing 2–3 times over 10 years, and the total cost reaches ₺40,000–50,000. LiFePO4 has a higher upfront cost, but with a cycle life of 6,000 cycles it needs no replacement at all over 10 years, and its total cost ends up similar to — or even lower than — lead-acid. Add the advantages in weight, maintenance and performance, and the balance tips decisively in lithium’s favor.

**There is a clear difference in safety**

LiFePO4 is the safest chemistry in the lithium family. The risk of thermal runaway is extremely low, and it is highly resistant to catching fire. Lead-acid batteries, on the other hand, can release hydrogen gas while charging, so they should not be used in enclosed spaces without adequate ventilation.

**Which one, and when?**

If you cycle the battery every day, if weight and volume matter — as in RVs, boats and off-grid installations — or if you simply don’t want to deal with maintenance, the choice is clearly LiFePO4. If your budget is genuinely very tight and usage is infrequent — backup power for a vacation home, for example — lead-acid can serve as a reasonable stopgap; just bear in mind that it is a choice made out of necessity, not a long-term saving.

For the vast majority of people investing in energy storage, LiFePO4 is the undisputed leader in both performance and total cost of ownership.
    `,
  },
  'hibrit-inverter-nedir': {
    title: 'What Is a Hybrid Inverter, and How Does It Differ from Off-Grid?',
    category: 'Inverters',
    readTime: '5 min',
    date: 'March 20, 2025',
    desc: 'The key differences between hybrid and off-grid inverters, and which one to use in which system.',
    content: `
## Hybrid vs. Off-Grid Inverters: What’s the Difference?

One of the most commonly confused topics when setting up a solar system is the difference between hybrid and off-grid inverters. In this article, we compare the two technologies clearly and simply.

## What Is an Inverter?

An inverter is the device that converts the DC electricity produced by solar panels into the AC electricity used in homes and businesses. It also handles tasks such as battery charge control, grid management and energy flow control.

## What Is a Hybrid Inverter?

A hybrid inverter is a versatile device that can work both connected to the grid (on-grid) and with a battery.

**How it works:**
1. Solar power is used for household consumption first
2. Surplus energy is stored in the battery
3. Once the battery is full, the excess is exported to the grid (net metering)
4. When there is no sun, or not enough of it, the battery takes over
5. When the battery is depleted, power is drawn from the grid

**Advantages:**
- Keeps running during grid outages (backup power)
- Maximizes energy savings
- Lets you sell surplus power to the grid through net metering
- Smart energy management

## What Is an Off-Grid Inverter?

An off-grid inverter is designed for systems that are completely independent of the grid. It runs on batteries and solar panels; there is no grid connection.

**Advantages:**
- Can be used where there is no grid (farms, mountain cabins, RVs)
- Complete independence from electricity bills
- Simple installation

**Disadvantages:**
- If battery capacity falls short, you will face power outages
- A diesel generator may be needed as backup
- Surplus energy cannot be sold to the grid

## Comparison Table

| Feature | Hybrid | Off-Grid |
|---------|--------|----------|
| Grid connection | Yes | No |
| Battery | Supported | Required |
| Works during outages | Yes | Yes |
| Export to grid | Yes | No |
| Urban use | Ideal | Not suitable |
| Remote locations | Limited | Ideal |
| Cost | Medium–high | Medium |

## Which One Should You Choose?

**Choose a hybrid inverter if:**
- You live in a city or in a grid-connected location
- You want to cut your electricity bill
- You want backup power during outages
- You want to benefit from net metering

**Choose an off-grid inverter if:**
- You are in a location with no grid connection
- You want complete energy independence
- You are installing it in an RV, boat or vacation home

## Popular Hybrid Inverter Brands

Growatt, Deye, Solis, SolarEdge and Huawei are among the leading brands in the hybrid inverter market. The power rating should be chosen to match the system’s total panel capacity (typically between 3 kW and 20 kW).

## Summary

If you live in the city and want both savings and security of supply, a **hybrid inverter** is the right choice. If you want a fully independent system, go off-grid.
    `,
  },
  'ges-nasil-kurulur': {
    title: 'Rooftop Solar Installation: A Complete Guide',
    category: 'Solar PV Systems',
    readTime: '10 min',
    date: 'March 15, 2025',
    desc: 'Permitting, technical requirements, cost calculation and payback period.',
    content: `
## Rooftop Solar Installation: A Step-by-Step Guide

A solar power system (known in Türkiye as a GES) is now one of the most profitable energy investments for households and businesses alike. In this guide, we cover rooftop solar installation from start to finish.

## 1. Feasibility and Preliminary Assessment

Before installation, you need to answer the following questions:

**Roof suitability:**
- Does the roof face south? (At least somewhere between southeast and southwest)
- Is the roof pitch between 15° and 40°?
- Is there any shading? (Chimneys, neighboring buildings, trees)
- Can the roof structure carry the load? (Panel weight: 10–12 kg/m²)

**Consumption analysis:**
- Check your electricity bills for the last 12 months
- Work out your average annual consumption (kWh)
- This figure determines the system size

## 2. System Sizing

Formula:
**Required capacity (kWp) = Annual consumption / (Daily peak sun hours × 365 × 0.85)**

**Example:** A home in Izmir consuming 6,000 kWh a year:
6,000 / (5.8 × 365 × 0.85) = a **3.3 kWp** system is sufficient

In practice, residential systems of 5–10 kWp are the most common choice.

## 3. Permits and Paperwork

### License-Exempt Generation (≤10 kW, for individuals)
- Application to TEDAŞ (the Turkish Electricity Distribution Corporation)
- Grid connection application to your regional distribution company (EDAŞ)
- Approval time: 30–60 days
- You can sell surplus generation to the grid (net metering)

### Systems between 10 and 1,000 kW
- Covered by license-exempt generation (no generation license required)
- An energy performance certificate may be required
- Building permit from the municipality (depends on the roof and building type)

## 4. Choosing the Equipment

**Solar panels:**
- Monocrystalline, at least 20% efficiency
- Choose brands that offer a 25-year performance warranty
- Turkish-made or European brands are recommended

**Inverter:**
- String inverter: Simple and economical
- Hybrid inverter: For those who want to add a battery
- Microinverter: Each panel works independently, minimal impact from shading

**Mounting system:**
- Suited to the roof type (tiled, trapezoidal metal sheet, flat roof)
- Aluminum profiles, stainless steel fasteners
- Rated for wind and snow loads

## 5. Installation Process

1. **Installing the mounting rails** (1–2 days)
2. **Mounting the panels on the rails** (1–2 days)
3. **DC cabling and combiner box** (half a day)
4. **Inverter installation and AC connection** (half a day)
5. **Meter replacement by the EDAŞ** (carried out by the distribution company’s crew; allow 1–4 weeks)
6. **Commissioning and testing** (a few hours)

## 6. Costs and Payback

**Average costs (2025):**
- 5 kWp system: ₺90,000 – 130,000
- 10 kWp system: ₺170,000 – 240,000

**Payback period:**
- Annual savings: ₺25,000 – 60,000 (depending on the system and region)
- Payback: 4 – 7 years
- System lifespan: 25–30 years → 18–25 years of net profit

## 7. Maintenance

Solar PV systems need very little maintenance:
- **Panel cleaning once or twice a year** (in rainy regions, rainfall alone may be enough)
- **An inverter check once a year**
- **Monitoring system:** Track production data in real time on your smartphone

## Summary

The steps for a rooftop solar installation: feasibility → sizing → permits → equipment → installation → commissioning. Done right, it is an investment that pays for itself within 4–7 years and keeps generating value for 25 years.
    `,
  },
  'karavan-enerji-paketi': {
    title: 'How to Choose the Best Power Kit for Your RV',
    category: 'Batteries',
    readTime: '6 min',
    date: 'March 8, 2025',
    desc: 'Working out your RV’s power consumption, choosing a portable power station and foldable solar panel options.',
    content: `
## RV Power Kit Guide

One of the biggest challenges of RV life is having enough power. Choosing the right power kit improves your comfort and protects your budget at the same time. In this guide, we walk you through choosing an energy system for your RV step by step.

## 1. Calculating Consumption

Start by working out what you need. Typical appliances in an RV and their consumption:

| Appliance | Power | Daily use | Daily consumption |
|-----------|-------|-----------|-------------------|
| LED lighting (5 lights) | 25W | 4 hours | 100 Wh |
| Fridge (12V) | 50W | 24 hours | 600 Wh |
| Phone charging (2 phones) | 20W | 3 hours | 60 Wh |
| Laptop | 65W | 3 hours | 195 Wh |
| Fan | 30W | 6 hours | 180 Wh |
| **Total** | | | **~1,135 Wh/day** |

This calculation points to consumption of roughly **1.5 kWh/day**. Add 30% as a safety margin and aim for a system with a capacity of **~2 kWh**.

## 2. Choosing a Battery

**Lithium LiFePO4 (recommended):**
- 80% depth of discharge → 100 Ah = 80 Ah usable
- Lightweight (~12 kg / 100 Ah)
- 3,000+ cycle life
- Fast charging

**Lead-Acid (AGM/GEL):**
- 50% discharge limit → 100 Ah = 50 Ah usable
- Heavy (~25 kg / 100 Ah)
- Low upfront cost

For the example above, a **100 Ah LiFePO4** battery (12V) is sufficient. For extra headroom, you can go for 200 Ah.

## 3. Choosing Solar Panels

There are two options for an RV:

**Fixed roof-mounted panels:**
- 100W – 400W
- Always charging
- Can limit your flexibility in where you park
- Mounted on a flat roof

**Foldable portable panels:**
- 100W – 200W (single unit)
- Can be placed in full sun at the optimum angle
- Can be packed away while the RV is on the move
- Can be used for more than one application

**Required panel capacity:**
For 2 kWh/day of consumption with an average of 5 peak sun hours:
2,000 Wh / 5 hours / 0.85 = **~470 W of panels**

In practice, 2 × 200W panels or 1 × 400W panel is enough.

## 4. Charge Controller (MPPT)

Regulates the energy flowing from the solar panels to the battery.

- **PWM:** Affordable, for small systems
- **MPPT:** More efficient (by up to 30%), recommended for larger systems

An MPPT charge controller rated at 20A – 40A is sufficient for an RV.

## 5. The Portable Power Station Alternative

For those who don’t want a complex installation, there is an all-in-one solution: **portable power stations.**

- 500 Wh – 3,000 Wh capacity
- AC output (just like a household outlet)
- USB and DC outputs
- Can be charged with solar panels
- Plug & play, no installation required

Ideal for weekend RVers and campers.

## 6. Inverter

Converts 12V/24V DC into 220V AC. Needed for laptops and small electrical appliances.

- Choose a pure sine wave inverter (for sensitive electronics)
- Capacity: 1.5 times the rating of your largest appliance
- 300W – 1,000W is sufficient for an RV

## Ready-Made Kit Suggestions

**Starter kit (weekend use):**
- 200 Ah LiFePO4 battery
- 2 × 200W foldable panels
- 40A MPPT charge controller
- 500W pure sine wave inverter

**Comfort kit for long trips:**
- 300 Ah LiFePO4 battery
- 400W roof panel + 200W portable panel
- 60A MPPT charge controller
- 1,000W pure sine wave inverter

## Summary

The right order for an RV energy system: calculate your consumption → determine battery capacity → size the panels → choose the MPPT controller and inverter. Although lithium batteries cost more upfront, their weight and lifespan advantages make them by far the best choice for RV use.
    `,
  },
}
