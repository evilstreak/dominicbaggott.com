# When bottle&shy;necks move

I’ve been chewing on what AI coding assistants actually change about how a product team works. Not the “will it replace engineers” question. Something more mundane, and I think more important: where the time goes. And *what we lose* when engineering stops being the slow part.

For as long as I’ve worked in tech, it’s been the slow part by some distance. Product development has looked roughly like this, give or take a step at either end depending on your particular flavour of process:

```
LEARN  PLAN  DESIGN BUILD                                         QA   SHIP
░░░░░░ ░░░░░ ░░░░░░ █████████████████████████████████████████████ ░░░░ ░░░░
```

Anything beyond a trivial bug fix was dominated by build time. Maybe **80%** of my hands-on engineering time was building things. With modern coding assistants, it looks more like this:

```
LEARN  PLAN  DESIGN BUILD    QA   SHIP
░░░░░░ ░░░░░ ░░░░░░ ████████ ░░░░ ░░░░
```

The bit that took most of the time now takes about as long as any other step. And that might even be understating it, because often my interaction is just a few minutes to plan the work with the agent, and then my focus is free to do other things while it works. The long stretches of uninterrupted *flow state* I used to covet for writing code have largely disappeared.

* * *

The obvious reaction is “great, we’ll get so much more done”. But you never get rid of bottlenecks, you just move them around. That’s one of the core lessons of *The Phoenix Project* (and its spiritual predecessor *The Goal*). So the question I find myself asking is: where have they gone? I think there are two obvious places, and they behave very differently. One **hard**, one *soft*. When you hit the hard one, work stops, and it reveals itself pretty plainly. The soft one gives though, so the work keeps moving but gets more and more diluted. Ironically, given the names, that actually makes the hard one the easier of the two to deal with.

## The hard one: everything around the build

Clunky deployment processes were never life or death for most teams. A team of six engineers shipping once each daily, with a deploy process that has a 15 minute test suite and a 5 minute build is only 2 hours a day. For a large, high performing team, where you have dozens of engineers shipping multiple times per day to the same app, it already mattered. Now though, your engineers can ship way more. Even that team of six engineers can start to get throttled by the 20 minute build.

This shipping increase isn’t hypothetical – GitHub published a blog post in October ’26 saying that [commits and PRs have tripled in a year, and agents now start 40% of all PRs][octoverse-2026].

[octoverse-2026]: https://github.blog/news-insights/octoverse/octoverse-commits-pushes-reach-new-highs-in-2026-as-developers-build-with-agents/

None of the fixes for this are news:

- Speed up your deploy process, so you can get a change live in single digit minutes
- Decouple deploy from release with feature flags, so you’re not blocking deploys on QA
- Get good observability, because more deploys means more bugs reaching prod even if each deploy is cleaner

This is all the DORA-type stuff that’s been best practice for years. What’s changed is that there’s no longer enough slack to get by without it. The good news is that it’s well trodden ground, and most teams now have spare engineering time to spend on it. AI helps here too – it can do a lot of the engineering leg work to improve these things. And if you hook it up to your logs and telemetry, it can do a lot of your initial debugging too. We’ve got a model hooked up to our Honeycomb for exactly that, so a bug report or something weird on a user call can go to an agent for the initial digging. Better observability makes life easier for the humans and for the agents, so it’s a double whammy: humans need less time on it, and need to look less often.

Anyway, it’s real, but I’m not too worried about it. The teams affected already have the skills to fix this. Plus, hard bottlenecks are a throughput problem, so it’s easy to notice when it needs attention.

## The soft one: deciding what to build

The soft one feels a lot less urgent, and a lot more important. I’m talking about the product work: working out the right thing to build, finding out whether it solved the problem you intended, and turning stuff off when it didn’t. Product management and user research.

This still isn’t new work, but this becoming the bottleneck worries me. This soft bottleneck doesn’t cap how much you ship, it **degrades the value** of what you ship. You can keep building at the new pace while doing a little less product thinking for each feature, and nothing visibly breaks. *Heck, delivery metrics might even get a beautiful boost for a while!* You’ve got capacity, so you can end up going straight from “user says they want blah” to “well, it’s cheap to build things now, so let’s build blah”. And that’s how you get a product that’s bloated and lacks direction and coherence.

The obvious argument here is that if building is cheap, we should build more and see if people use it. And we should – a cheap feature shipped fast can get you further than a week of careful thinking. But you can only learn from it if you know what you’re testing and how, and if you’re willing to declare it a failed experiment and turn off the feature when needed. And none of that absolves you from needing product taste. *The coding assistants sure aren’t going to provide it.*

So I think the build being slow was quietly doing work for us, by forcing us to choose **what not to build**. Now we could build everything, but we still shouldn’t, and that’s harder to do if we haven’t been exercising those muscles properly. And unlike the engineering side, most orgs don’t have spare capacity here. Most teams I’ve worked in have been one product manager-y person, one designer-y person, maybe a user researcher, and then a bucket load of engineers. Sometimes those folks served multiple teams. That shape made sense when engineering was the constraint. I’m not sure it does now.

## Where I’ve ended up

Longer term, I think what the industry expects from an engineer will change. The tools are making it easier for folks to do more with less technical expertise. Shipping stuff is table stakes. I predict the differentiator will be how much product and design expertise you can bring to the team. One of the GOV.UK mottos was “user research is a team sport”, and one way or another I think that’s going to stop being an aspiration and start being the norm.

If I were shaping a team today, these are the things I’d want to remember:

- The next hire probably isn’t another engineer. More likely a PM, a researcher, or someone who can tell you whether what shipped actually worked.
- Give engineers who are keen on that new shape the chance to grow into it. Have them shadow product people, and sit in on research.
- Measure business outcomes, not features shipped. Output used to be a rough proxy for value because output was expensive. Now it’s cheap, the proxy breaks.

The engineering homework is stuff everyone will get round to eventually. The interesting part is the rebalancing between building things and deciding what’s worth building. That job falls to engineering leaders: shaping the team, its habits, and what it measures. AI, even just AI for coding, is a big enough upheaval to how engineering works that it’s worth redesigning the org around, and I suspect the orgs that do will eat the lunch of the ones that don’t.

---

If you’d like a hand working out where your team’s bottleneck has gone, and what to change because of it, [I’d love to chat](mailto:dominic.baggott@gmail.com).
