# Everything a prediction touches.

- **115** requests a second
- **~1M** GPU-hours a month
- **95%+** of the bill, GPUs

The idea behind Replicate was to make AI models something you could build into ordinary software, like any other API, without needing to know the nitty-gritty. Just pick your model and run your prediction[^prediction].

A request reaches the API[^api], gets routed to a model running somewhere on a fleet of 1,500 GPUs[^routing], gets handed to a process inside a Docker container running Cog[^cog], and produces output that’s streamed back to the user[^streaming]. Somewhere north of 10 million times a day.

Along the way it gets metered and billed, and also turns up in the revenue and margin reporting, which told us whether that request, and millions like it, had made us any money.

Ten million requests a day sounds like a lot, but it’s only about 115 a second, a modest load for a web service. What made Replicate big was how long each one ran. A lot of models took a long time to run – sometimes several minutes – so the real measure was GPU time: a fleet capable of around a million GPU-hours a month.

That made the economics strange. Most infrastructure bills are a blend: some compute, some databases, some storage, some bandwidth, nothing dominant. In Replicate’s early days, more than 95% of the bill was GPU time,[^then] and even once storage and bandwidth grew into real line items, GPUs still dominated. “Do we really need three instances of the web service, or can we get away with two?” stopped being a question worth asking. It was a rounding error, so you picked the bigger option and spent your attention where the money was: keeping the GPUs busy. The margin numbers drove how we ran the fleet.

The technical work of building the system was interesting, but the investigative work of figuring out which parts of our usage made us money was downright fascinating. Not many engineers get to follow a request all the way from the front door to the money, and maybe we’re all a little worse off for it.

[^prediction]: Speaking of nitty-gritty, that term was maybe poorly chosen – prediction or inference is the term in the machine learning literature: a model predicting the right output for a given input. Most people would say “request” or “run”, which is rather the point of what we were trying to do.
[^api]: I built the first and second versions of that API.
[^routing]: I built the second and third versions of that routing.
[^cog]: I built the second and third versions of that process.
[^streaming]: I built the first version of… you know what, I was the founding engineer. You can assume I – along with my partner in crime Nick Stenning[^nick] – built early versions of most of Replicate’s systems, the billing systems and margin reporting included, and I can stop writing these notes.
[^nick]: [Nick Stenning](https://whiteink.com) was the third employee and the two of us handled infrastructure for the best part of a year before growing the team. He is an excellent human and a world-class infrastructure engineer. If you’re hiring one, you’d be lucky to get him. He doesn’t know I’m writing this.
[^then]: I should note that I left in early 2025. The numbers, and the way I describe the system, are Replicate as it was then, not as it is now it’s been acquired by Cloudflare.
