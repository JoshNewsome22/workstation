const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const n=parseFloat(String(v==null?'':v).replace('%',''));return isFinite(n)?n:null;};
const r1=v=>Math.round(v*10)/10;

/* ---------------- the reference list: every citation in the catalogue is here, once ---------------- */
const REFS={
  athens07:'Athens, E. S., Vollmer, T. R., &amp; St. Peter Pipkin, C. C. (2007). Shaping academic task engagement with percentile schedules. <em>Journal of Applied Behavior Analysis, 40</em>(3), 475&ndash;488.',
  athens10:'Athens, E. S., &amp; Vollmer, T. R. (2010). An investigation of differential reinforcement of alternative behavior without extinction. <em>Journal of Applied Behavior Analysis, 43</em>(4), 569&ndash;589.',
  austin11:'Austin, J. L., &amp; Bevan, D. (2011). Using differential reinforcement of low rates to reduce children&rsquo;s requests for teacher attention. <em>Journal of Applied Behavior Analysis, 44</em>(3), 451&ndash;461.',
  baum74:'Baum, W. M. (1974). On two types of deviation from the matching law: Bias and undermatching. <em>Journal of the Experimental Analysis of Behavior, 22</em>(1), 231&ndash;242.',
  berryman62:'Berryman, R., &amp; Nevin, J. A. (1962). Interlocking schedules of reinforcement. <em>Journal of the Experimental Analysis of Behavior, 5</em>(2), 213&ndash;223.',
  borrero02:'Borrero, J. C., &amp; Vollmer, T. R. (2002). An application of the matching law to severe problem behavior. <em>Journal of Applied Behavior Analysis, 35</em>(1), 13&ndash;27.',
  bulla17:'Bulla, A. J., &amp; Frieder, J. E. (2017). Self-and-match system suppresses vocal stereotypy during independent work. <em>Behavior Analysis: Research and Practice, 17</em>(3), 274&ndash;285.',
  cammilleri05:'Cammilleri, A. P., &amp; Hanley, G. P. (2005). Use of a lag differential reinforcement contingency to increase varied selections of classroom activities. <em>Journal of Applied Behavior Analysis, 38</em>(1), 111&ndash;115.',
  carr85:'Carr, E. G., &amp; Durand, V. M. (1985). Reducing behavior problems through functional communication training. <em>Journal of Applied Behavior Analysis, 18</em>(2), 111&ndash;126.',
  carr09:'Carr, J. E., Severtson, J. M., &amp; Lepper, T. L. (2009). Noncontingent reinforcement is an empirically supported treatment for problem behavior exhibited by individuals with developmental disabilities. <em>Research in Developmental Disabilities, 30</em>(1), 44&ndash;57.',
  catania07:'Catania, A. C. (2007). <em>Learning</em> (4th interim ed.). Sloan. (Tables 10-1 and 11-1, reproduced in DeLeon, Bullock &amp; Catania, 2013.)',
  catania82:'Catania, A. C., Matthews, B. A., &amp; Shimoff, E. (1982). Instructed versus shaped human verbal behavior: Interactions with nonverbal responding. <em>Journal of the Experimental Analysis of Behavior, 38</em>(3), 233&ndash;248.',
  cataniareynolds68:'Catania, A. C., &amp; Reynolds, G. S. (1968). A quantitative analysis of the responding maintained by interval schedules of reinforcement. <em>Journal of the Experimental Analysis of Behavior, 11</em>(3, Pt. 2), 327&ndash;383.',
  cooper20:'Cooper, J. O., Heron, T. E., &amp; Heward, W. L. (2020). <em>Applied behavior analysis</em> (3rd ed.). Pearson.',
  deitz73:'Deitz, S. M., &amp; Repp, A. C. (1973). Decreasing classroom misbehavior through the use of DRL schedules of reinforcement. <em>Journal of Applied Behavior Analysis, 6</em>(3), 457&ndash;463.',
  deitz77:'Deitz, S. M. (1977). An analysis of programming DRL schedules in educational settings. <em>Behaviour Research and Therapy, 15</em>(1), 103&ndash;111.',
  deleon13:'DeLeon, I. G., Bullock, C. E., &amp; Catania, A. C. (2013). Arranging reinforcement contingencies in applied settings: Fundamentals and implications of recent basic and applied research. In G. J. Madden (Ed.), <em>APA handbook of behavior analysis: Vol. 2. Translating principles into practice</em> (pp. 47&ndash;75). American Psychological Association.',
  deleon14:'DeLeon, I. G., Graff, R. B., Frank-Crawford, M. A., Rooker, G. W., &amp; Bullock, C. E. (2014). Reinforcement arrangements for learners with autism spectrum disorder. In J. Tarbox, D. R. Dixon, P. Sturmey &amp; J. L. Matson (Eds.), <em>Handbook of early intervention for autism spectrum disorders</em> (pp. 205&ndash;228). Springer.',
  farrell08:'Farrell, A., &amp; McDougall, D. (2008). Self-monitoring of pace to improve math fluency of high school students with disabilities. <em>Behavior Analysis in Practice, 1</em>(2), 26&ndash;35.',
  fs57:'Ferster, C. B., &amp; Skinner, B. F. (1957). <em>Schedules of reinforcement</em>. Appleton-Century-Crofts. (Quoted from the B. F. Skinner Foundation e-book reprint; cited by chapter.)',
  fisher97:'Fisher, W. W., &amp; Mazur, J. E. (1997). Basic and applied research on choice responding. <em>Journal of Applied Behavior Analysis, 30</em>(3), 387&ndash;410.',
  fisher15:'Fisher, W. W., Greer, B. D., Fuhrman, A. M., &amp; Querim, A. C. (2015). Using multiple schedules during functional communication training to promote rapid transfer of treatment effects. <em>Journal of Applied Behavior Analysis, 48</em>(4), 713&ndash;733.',
  fleshler62:'Fleshler, M., &amp; Hoffman, H. S. (1962). A progression for generating variable-interval schedules. <em>Journal of the Experimental Analysis of Behavior, 5</em>(4), 529&ndash;530.',
  galbicka94:'Galbicka, G. (1994). Shaping in the 21st century: Moving percentile schedules into applied settings. <em>Journal of Applied Behavior Analysis, 27</em>(4), 739&ndash;760.',
  girolami09:'Girolami, K. M., Kahng, S., Hilker, K. A., &amp; Girolami, P. A. (2009). Differential reinforcement of high rate behavior to increase the pace of self-feeding. <em>Behavioral Interventions, 24</em>(1), 17&ndash;22.',
  greer16:'Greer, B. D., Fisher, W. W., Saini, V., Owen, T. M., &amp; Jones, J. K. (2016). Functional communication training during reinforcement schedule thinning: An analysis of 25 applications. <em>Journal of Applied Behavior Analysis, 49</em>(1), 105&ndash;121.',
  hackenberg09:'Hackenberg, T. D. (2009). Token reinforcement: A review and analysis. <em>Journal of the Experimental Analysis of Behavior, 91</em>(2), 257&ndash;286.',
  hackenberg18:'Hackenberg, T. D. (2018). Token reinforcement: Translational research and application. <em>Journal of Applied Behavior Analysis, 51</em>(2), 393&ndash;435.',
  hagopian94:'Hagopian, L. P., Fisher, W. W., &amp; Legacy, S. M. (1994). Schedule effects of noncontingent reinforcement on attention-maintained destructive behavior in identical quadruplets. <em>Journal of Applied Behavior Analysis, 27</em>(2), 317&ndash;325.',
  hagopian98:'Hagopian, L. P., Fisher, W. W., Sullivan, M. T., Acquisto, J., &amp; LeBlanc, L. A. (1998). Effectiveness of functional communication training with and without extinction and punishment: A summary of 21 inpatient cases. <em>Journal of Applied Behavior Analysis, 31</em>(2), 211&ndash;235.',
  hagopian05:'Hagopian, L. P., Contrucci Kuhn, S. A., Long, E. S., &amp; Rush, K. S. (2005). Schedule thinning following communication training: Using competing stimuli to enhance tolerance to decrements in reinforcer density. <em>Journal of Applied Behavior Analysis, 38</em>(2), 177&ndash;193.',
  hagopian11:'Hagopian, L. P., Boelter, E. W., &amp; Jarmolowicz, D. P. (2011). Reinforcement schedule thinning following functional communication training: Review and recommendations. <em>Behavior Analysis in Practice, 4</em>(1), 4&ndash;16.',
  hanley97:'Hanley, G. P., Piazza, C. C., Fisher, W. W., Contrucci, S. A., &amp; Maglieri, K. A. (1997). Evaluation of client preference for function-based treatment packages. <em>Journal of Applied Behavior Analysis, 30</em>(3), 459&ndash;473.',
  hanley01:'Hanley, G. P., Iwata, B. A., &amp; Thompson, R. H. (2001). Reinforcement schedule thinning following treatment with functional communication training. <em>Journal of Applied Behavior Analysis, 34</em>(1), 17&ndash;38.',
  hanley14:'Hanley, G. P., Jin, C. S., Vanselow, N. R., &amp; Hanratty, L. A. (2014). Producing meaningful improvements in problem behavior of children with autism via synthesized analyses and treatments. <em>Journal of Applied Behavior Analysis, 47</em>(1), 16&ndash;36.',
  hartmann76:'Hartmann, D. P., &amp; Hall, R. V. (1976). The changing criterion design. <em>Journal of Applied Behavior Analysis, 9</em>(4), 527&ndash;532.',
  herrnstein61:'Herrnstein, R. J. (1961). Relative and absolute strength of response as a function of frequency of reinforcement. <em>Journal of the Experimental Analysis of Behavior, 4</em>(3), 267&ndash;272.',
  herrnsteinmorse58:'Herrnstein, R. J., &amp; Morse, W. H. (1958). A conjunctive schedule of reinforcement. <em>Journal of the Experimental Analysis of Behavior, 1</em>(1), 15&ndash;24.',
  hodos61:'Hodos, W. (1961). Progressive ratio as a measure of reward strength. <em>Science, 134</em>(3483), 943&ndash;944.',
  ivy17:'Ivy, J. W., Meindl, J. N., Overley, E., &amp; Robson, K. M. (2017). Token economy: A systematic review of procedural descriptions. <em>Behavior Modification, 41</em>(5), 708&ndash;737.',
  iwata94:'Iwata, B. A., Pace, G. M., Cowdery, G. E., &amp; Miltenberger, R. G. (1994). What makes extinction work: An analysis of procedural form and function. <em>Journal of Applied Behavior Analysis, 27</em>(1), 131&ndash;144.',
  kahng00:'Kahng, S., Iwata, B. A., DeLeon, I. G., &amp; Wallace, M. D. (2000). A comparison of procedures for programming noncontingent reinforcement schedules. <em>Journal of Applied Behavior Analysis, 33</em>(2), 223&ndash;231.',
  kelleher66:'Kelleher, R. T. (1966). Conditioned reinforcement in second-order schedules. <em>Journal of the Experimental Analysis of Behavior, 9</em>(5), 475&ndash;485.',
  lalli95:'Lalli, J. S., Casey, S., &amp; Kates, K. (1995). Reducing escape behavior and increasing task completion with functional communication training, extinction, and response chaining. <em>Journal of Applied Behavior Analysis, 28</em>(3), 261&ndash;268.',
  lattal10:'Lattal, K. A. (2010). Delayed reinforcement of operant behavior. <em>Journal of the Experimental Analysis of Behavior, 93</em>(1), 129&ndash;139.',
  lattalneef96:'Lattal, K. A., &amp; Neef, N. A. (1996). Recent reinforcement-schedule research and applied behavior analysis. <em>Journal of Applied Behavior Analysis, 29</em>(2), 213&ndash;230.',
  lee02:'Lee, R., McComas, J. J., &amp; Jawor, J. (2002). The effects of differential and lag reinforcement schedules on varied verbal responding by individuals with autism. <em>Journal of Applied Behavior Analysis, 35</em>(4), 391&ndash;402.',
  lennox87:'Lennox, D. B., Miltenberger, R. G., &amp; Donnelly, D. R. (1987). Response interruption and DRL for the reduction of rapid eating. <em>Journal of Applied Behavior Analysis, 20</em>(3), 279&ndash;284.',
  lermaniwata95:'Lerman, D. C., &amp; Iwata, B. A. (1995). Prevalence of the extinction burst and its attenuation during treatment. <em>Journal of Applied Behavior Analysis, 28</em>(1), 93&ndash;94.',
  lerman96:'Lerman, D. C., Iwata, B. A., Shore, B. A., &amp; Kahng, S. (1996). Responding maintained by intermittent reinforcement: Implications for the use of extinction with problem behavior. <em>Journal of Applied Behavior Analysis, 29</em>(2), 153&ndash;171.',
  lerman99:'Lerman, D. C., Iwata, B. A., &amp; Wallace, M. D. (1999). Side effects of extinction: Prevalence of bursting and aggression during the treatment of self-injurious behavior. <em>Journal of Applied Behavior Analysis, 32</em>(1), 1&ndash;8.',
  lieving03:'Lieving, G. A., &amp; Lattal, K. A. (2003). Recency, repeatability, and reinforcer retrenchment: An experimental analysis of resurgence. <em>Journal of the Experimental Analysis of Behavior, 80</em>(2), 217&ndash;233.',
  lindberg99:'Lindberg, J. S., Iwata, B. A., Kahng, S., &amp; DeLeon, I. G. (1999). DRO contingencies: An analysis of variable-momentary schedules. <em>Journal of Applied Behavior Analysis, 32</em>(2), 123&ndash;136.',
  mace90:'Mace, F. C., Lalli, J. S., Shea, M. C., Lalli, E. P., West, B. J., Roberts, M., &amp; Nevin, J. A. (1990). The momentum of human behavior in a natural setting. <em>Journal of the Experimental Analysis of Behavior, 54</em>(3), 163&ndash;172.',
  mace10:'Mace, F. C., McComas, J. J., Mauro, B. C., Progar, P. R., Taylor, B., Ervin, R., &amp; Zangrillo, A. N. (2010). Differential reinforcement of alternative behavior increases resistance to extinction: Clinical demonstration, animal modeling, and clinical test. <em>Journal of the Experimental Analysis of Behavior, 93</em>(3), 349&ndash;367.',
  marcus95:'Marcus, B. A., &amp; Vollmer, T. R. (1995). Effects of differential negative reinforcement on disruption and compliance. <em>Journal of Applied Behavior Analysis, 28</em>(2), 229&ndash;230.',
  mazaleski93:'Mazaleski, J. L., Iwata, B. A., Vollmer, T. R., Zarcone, J. R., &amp; Smith, R. G. (1993). Analysis of the reinforcement and extinction components in DRO contingencies with self-injury. <em>Journal of Applied Behavior Analysis, 26</em>(2), 143&ndash;156.',
  neef92:'Neef, N. A., Mace, F. C., Shea, M. C., &amp; Shade, D. (1992). Effects of reinforcer rate and reinforcer quality on time allocation: Extensions of matching theory to educational settings. <em>Journal of Applied Behavior Analysis, 25</em>(3), 691&ndash;699.',
  nevingrace00:'Nevin, J. A., &amp; Grace, R. C. (2000). Behavioral momentum and the law of effect. <em>Behavioral and Brain Sciences, 23</em>(1), 73&ndash;90.',
  page85:'Page, S., &amp; Neuringer, A. (1985). Variability is an operant. <em>Journal of Experimental Psychology: Animal Behavior Processes, 11</em>(3), 429&ndash;452.',
  poling82:'Poling, A., &amp; Ryan, C. (1982). Differential-reinforcement-of-other-behavior schedules: Therapeutic applications. <em>Behavior Modification, 6</em>(1), 3&ndash;21.',
  powers68:'Powers, R. B. (1968). Clock-delivered reinforcers in conjunctive and interlocking schedules. <em>Journal of the Experimental Analysis of Behavior, 11</em>(5), 579&ndash;586.',
  repp83:'Repp, A. C., Barton, L. E., &amp; Brulle, A. R. (1983). A comparison of two procedures for programming the differential reinforcement of other behaviors. <em>Journal of Applied Behavior Analysis, 16</em>(4), 435&ndash;445.',
  reynolds61:'Reynolds, G. S. (1961). Behavioral contrast. <em>Journal of the Experimental Analysis of Behavior, 4</em>(1), 57&ndash;71.',
  rhode83:'Rhode, G., Morgan, D. P., &amp; Young, K. R. (1983). Generalization and maintenance of treatment gains of behaviorally handicapped students from resource rooms to regular classrooms using self-evaluation procedures. <em>Journal of Applied Behavior Analysis, 16</em>(2), 171&ndash;188.',
  roane01:'Roane, H. S., Lerman, D. C., &amp; Vorndran, C. M. (2001). Assessing reinforcers under progressive schedule requirements. <em>Journal of Applied Behavior Analysis, 34</em>(2), 145&ndash;167.',
  roane04:'Roane, H. S., Fisher, W. W., Sgro, G. M., Falcomata, T. S., &amp; Pabico, R. R. (2004). An alternative method of thinning reinforcer delivery during differential reinforcement. <em>Journal of Applied Behavior Analysis, 37</em>(2), 213&ndash;218.',
  saini16:'Saini, V., Miller, S. A., &amp; Fisher, W. W. (2016). Multiple schedules in practical application: Research trends and implications for future investigation. <em>Journal of Applied Behavior Analysis, 49</em>(2), 421&ndash;444.',
  skinner48:'Skinner, B. F. (1948). &ldquo;Superstition&rdquo; in the pigeon. <em>Journal of Experimental Psychology, 38</em>(2), 168&ndash;172.',
  tarpley79:'Tarpley, H. D., &amp; Schroeder, S. R. (1979). Comparison of DRO and DRI on rate of suppression of self-injurious behavior. <em>American Journal of Mental Deficiency, 84</em>(2), 188&ndash;194.',
  tiger04:'Tiger, J. H., &amp; Hanley, G. P. (2004). Developing stimulus control of preschooler mands: An analysis of schedule-correlated and contingency-specifying stimuli. <em>Journal of Applied Behavior Analysis, 37</em>(4), 517&ndash;521.',
  tiger06:'Tiger, J. H., Hanley, G. P., &amp; Hernandez, E. (2006). An evaluation of the value of choice with preschool children. <em>Journal of Applied Behavior Analysis, 39</em>(1), 1&ndash;16.',
  tiger08:'Tiger, J. H., Hanley, G. P., &amp; Bruzek, J. (2008). Functional communication training: A review and practical guide. <em>Behavior Analysis in Practice, 1</em>(1), 16&ndash;23.',
  vollmeriwata92:'Vollmer, T. R., &amp; Iwata, B. A. (1992). Differential reinforcement as treatment for behavior disorders: Procedural and functional variations. <em>Research in Developmental Disabilities, 13</em>(4), 393&ndash;417.',
  vollmer93:'Vollmer, T. R., Iwata, B. A., Zarcone, J. R., Smith, R. G., &amp; Mazaleski, J. L. (1993). The role of attention in the treatment of attention-maintained self-injurious behavior: Noncontingent reinforcement and differential reinforcement of other behavior. <em>Journal of Applied Behavior Analysis, 26</em>(1), 9&ndash;21.',
  vollmer97:'Vollmer, T. R., Ringdahl, J. E., Roane, H. S., &amp; Marcus, B. A. (1997). Negative side effects of noncontingent reinforcement. <em>Journal of Applied Behavior Analysis, 30</em>(1), 161&ndash;164.',
  vollmer99:'Vollmer, T. R., Roane, H. S., Ringdahl, J. E., &amp; Marcus, B. A. (1999). Evaluating treatment challenges with differential reinforcement of alternative behavior. <em>Journal of Applied Behavior Analysis, 32</em>(1), 9&ndash;23.',
  wright02:'Wright, C. S., &amp; Vollmer, T. R. (2002). Evaluation of a treatment package to reduce rapid eating. <em>Journal of Applied Behavior Analysis, 35</em>(1), 89&ndash;93.',
  zeiler77:'Zeiler, M. (1977). Schedules of reinforcement: The controlling variables. In W. K. Honig &amp; J. E. R. Staddon (Eds.), <em>Handbook of operant behavior</em> (pp. 201&ndash;232). Prentice-Hall.'
};
const FAM={basic:'Basic',time:'Time-based',dr:'Differential reinforcement',compound:'Compound and complex',applied:'Applied arrangements'};
/* ---------------- the catalogue ----------------
   id, fam, name, abbr, nota (notation), one (one line), def (definition), prog (how it is programmed),
   prod (what it produces), used (where the applied literature has used it), pit (what goes wrong), ex (a school example), refs */
const CAT=[
{id:'crf',fam:'basic',name:'Continuous reinforcement',abbr:'CRF',nota:'FR 1',one:'Every instance of the response produces the reinforcer.',
 def:'The ratio of responses to reinforcers is fixed at one. Ferster and Skinner (1957) list it with extinction as one of the two nonintermittent schedules; DeLeon, Bullock and Catania (2013) note that it is unusual both inside and outside the laboratory, since environments seldom pay every response.',
 prog:'Deliver the reinforcer immediately after each instance of the defined response, every time, by every adult. Write the response class exactly: CRF teaches whatever gets paid, including the prompt dependence or the sloppy form that was paid along with it.',
 prod:'Fast acquisition and a high, steady rate while the reinforcer keeps its value; quick satiation with consumables; the least persistence of any schedule when reinforcement stops, with a burst and then a fast decline.',
 used:'The acquisition phase of discrete-trial teaching; the first phase of functional communication training, in which every communication response is honored before thinning begins (Carr &amp; Durand, 1985; Hagopian et al., 1998); the first phase of differential reinforcement of alternative behavior (Vollmer et al., 1999).',
 pit:'Satiation; an abrupt move to a lean schedule that looks like extinction to the learner; staff who drift to intermittent delivery without a plan, which is a variable-ratio schedule nobody designed. Lerman et al. (1996) showed that behavior with an intermittent history extinguishes more slowly, which cuts both ways.',
 ex:'Every correct card touch earns a token; every &ldquo;break please&rdquo; earns a break, for the first week.',refs:['fs57','deleon13','carr85','hagopian98','vollmer99','lerman96']},
{id:'ext',fam:'basic',name:'Extinction',abbr:'EXT',nota:'EXT',one:'The reinforcer that maintained the response is withheld; the response no longer pays.',
 def:'In Ferster and Skinner&rsquo;s terms, &ldquo;no responses are reinforced.&rdquo; As a treatment component it means withholding the reinforcer that the assessment identified: attention extinction, escape extinction, or sensory extinction. Iwata, Pace, Cowdery and Miltenberger (1994) showed that extinction works only when the consequence withheld is the one that maintained the behavior; planned ignoring of escape-maintained behavior is not extinction, it is a reinforcer.',
 prog:'Name the maintaining reinforcer; withhold it for every instance; keep delivering it for the alternative response (DRA) or on a time basis (NCR); write what staff do at each instance so that nobody delivers the reinforcer by accident.',
 prod:'A temporary increase in rate, magnitude or novel forms of the behavior in a minority of cases (an extinction burst), and sometimes aggression, both clearly less common when extinction is combined with reinforcement procedures than when it is used alone (Lerman &amp; Iwata, 1995; Lerman, Iwata &amp; Wallace, 1999); slower extinction after an intermittent history (Lerman et al., 1996); spontaneous recovery after a break; and resurgence of an older response when a newer one is in turn extinguished (Lieving &amp; Lattal, 2003).',
 used:'A component of nearly every function-based treatment: FCT, DRA, DRO and NCR all include it in their usual forms. Hagopian et al. (1998) found FCT with extinction far more effective than FCT without it across 21 inpatient cases.',
 pit:'A mislabelled function; inconsistent application, which turns extinction into intermittent reinforcement and makes the behavior more persistent; bursts that endanger the student or others; behaviors whose reinforcer cannot be withheld (automatic) or must not be (a safety need).',
 ex:'Calling out no longer produces a teacher response; raising a hand does, every time, within five seconds.',refs:['fs57','iwata94','lermaniwata95','lerman99','lerman96','lieving03','hagopian98']},
{id:'fr',fam:'basic',name:'Fixed ratio',abbr:'FR',nota:'FR n',one:'The reinforcer follows the last of a fixed number of responses, counted from the previous reinforcer.',
 def:'&ldquo;A response is reinforced upon completion of a fixed number of responses counted from the preceding reinforcement&rdquo; (Ferster &amp; Skinner, 1957, Chapter 2). FR 1 is continuous reinforcement.',
 prog:'Count responses; deliver the reinforcer with the nth; reset the count. In practice: every five correct problems earns a token; every three items completed earns a check.',
 prod:'Break and run: a pause after each reinforcer, then a high, nearly constant rate until the next. The pause lengthens as the ratio grows and as other reinforcement becomes available; a ratio raised too far or too fast produces strain, with long pauses and ragged responding (Ferster &amp; Skinner, 1957, Chapter 4). Pauses do not disappear immediately when the ratio is lowered, nor return immediately when it is raised again.',
 used:'Token production schedules in token economies (Hackenberg, 2018); the response requirement in chained-schedule thinning, where the number of tasks before a break request is honored is raised stepwise (Lalli, Casey &amp; Kates, 1995); the baseline for progressive-ratio assessment. Raising the ratio required for problem behavior is one route to reducing it (DeLeon et al., 2013).',
 pit:'Ratio strain from a step that is too large; the post-reinforcement pause read as noncompliance; FR 1 moved to FR 5 in one step.',
 ex:'Ten math problems earn five minutes of a chosen activity; the step from five problems to ten is taken only after a week at five.',refs:['fs57','hackenberg18','lalli95','deleon13']},
{id:'vr',fam:'basic',name:'Variable ratio',abbr:'VR',nota:'VR n',one:'The number of responses required varies around a mean from one reinforcer to the next.',
 def:'&ldquo;Similar to fixed-ratio except that reinforcements are scheduled according to a random series of ratios having a given mean and lying between arbitrary values&rdquo; (Ferster &amp; Skinner, 1957).',
 prog:'Write a list of ratios in an arithmetic progression (2, 4, 6, 8 &hellip;), shuffle it, and work through it; or use a random-ratio procedure (a die) when the exact distribution matters less. Many short ratios balanced by a few long ones maintain more behavior than a few short ones balanced by many moderate ones, even at the same mean (DeLeon et al., 2013).',
 prod:'A high, steady rate with little or no pause after reinforcement; the most persistence under extinction of the basic schedules.',
 used:'Maintenance phases after acquisition; intermittent praise that is unpredictable to the student; the random sample of periods a teacher matches in a self-monitoring system (Rhode, Morgan &amp; Young, 1983). An unplanned VR schedule from inconsistent staff responses is the usual way problem behavior becomes persistent (Lerman et al., 1996).',
 pit:'A mean raised too far produces strain just as a fixed ratio does; a list that is not shuffled becomes a fixed sequence the student learns.',
 ex:'Praise after a random 2 to 6 completed items, drawn from a shuffled card deck; the mean is 4.',refs:['fs57','deleon13','rhode83','lerman96']},
{id:'rr',fam:'basic',name:'Random ratio',abbr:'RR',nota:'RR n (p = 1/n)',one:'Each response is reinforced with a constant probability; the mean ratio is the reciprocal of that probability.',
 def:'A subcategory of variable-ratio schedules in which the probability that a response is reinforced stays constant from response to response, so no maximum ratio can be stated (DeLeon et al., 2013, after Sidley &amp; Schoenfeld, 1964).',
 prog:'Roll a die after each response; reinforce on a six (RR 6). A four-sided die arranges RR 4; a spinner or a random-number app arranges any value.',
 prod:'As for VR: high and steady. Because the probability never climbs within a ratio, there is no end-of-ratio acceleration.',
 used:'Where a VR list is impractical; classroom lotteries in which each correct response earns a draw.',
 pit:'Long runs without reinforcement happen by chance; set a safety cap (reinforce the next response after k unpaid ones) if the student cannot yet tolerate them.',
 ex:'Each completed line of handwriting earns a dice roll; a six earns the sticker.',refs:['deleon13']},
{id:'fi',fam:'basic',name:'Fixed interval',abbr:'FI',nota:'FI t',one:'The first response after a fixed time since the last reinforcer is reinforced.',
 def:'&ldquo;The first response occurring after a given interval of time measured from the preceding reinforcement is reinforced&rdquo; (Ferster &amp; Skinner, 1957). Responses during the interval have no effect.',
 prog:'Start a timer at the last reinforcer; when it runs out, reinforce the next response. Many classroom contingencies are FI without being named: the check at the end of the period, the rating at the bell.',
 prod:'The scallop: a pause after reinforcement, then acceleration to a terminal rate just before the next reinforcer is due. Because reinforcement is timed, the schedule &ldquo;differentially reinforces responses following pauses&rdquo; (Chapter 5). Verbally able humans often show flat high or flat low patterns instead, because self-instruction takes over (Catania, Matthews &amp; Shimoff, 1982).',
 used:'Scheduled check-ins and end-of-period ratings; as a comparison condition in schedule-thinning research (Hanley, Iwata &amp; Thompson, 2001).',
 pit:'Work that starts only before the check; a student who has learned the clock. Shorten the interval, rate the whole period, or make the check variable.',
 ex:'The teacher comes by at the end of every 10 minutes; if the student is working at that moment, the token is given.',refs:['fs57','catania82','hanley01','deleon13']},
{id:'vi',fam:'basic',name:'Variable interval',abbr:'VI',nota:'VI t',one:'The interval that must elapse before a response is reinforced varies around a mean.',
 def:'&ldquo;Similar to fixed-interval except that reinforcements are scheduled according to a random series of intervals having a given mean&rdquo; (Ferster &amp; Skinner, 1957). The schedule &ldquo;is designed to produce a constant rate by not permitting any feature of the bird&rsquo;s behavior to acquire discriminative properties,&rdquo; and its shortest interval is set near zero &ldquo;to prevent the development of a pause after reinforcement&rdquo; (Chapter 6).',
 prog:'Choose the mean and the range; generate the intervals as a shuffled arithmetic series or with the Fleshler and Hoffman (1962) progression, which keeps the probability of reinforcement nearly constant through the interval (Catania &amp; Reynolds, 1968). The Design page generates both.',
 prod:'A moderate, steady rate with brief pauses; the rate rises with reinforcement rate but with diminishing returns (Catania &amp; Reynolds, 1968); more stable than ratio schedules when conditions change, because a wide range of rates earns about the same reinforcement (DeLeon et al., 2013).',
 used:'The schedule of choice for unpredictable teacher attention; the baseline schedules in applied studies of choice, where VI rates and reinforcer quality decided how students allocated their time (Neef, Mace, Shea &amp; Shade, 1992).',
 pit:'An arithmetic series without short intervals produces a pause after each reinforcer; a mean too long for the student&rsquo;s history looks like extinction.',
 ex:'The teacher&rsquo;s timer vibrates at intervals averaging 3 minutes (1 to 6); at each vibration the next on-task moment earns praise.',refs:['fs57','fleshler62','cataniareynolds68','neef92','deleon13']},
{id:'ri',fam:'basic',name:'Random interval',abbr:'RI',nota:'RI t',one:'Reinforcement is set up by sampling a probability at a fixed cycle; no longest interval exists.',
 def:'A variable-interval variant in which, every cycle (say every second), a reinforcer is set up with a fixed probability; the mean interval is the cycle length divided by the probability (DeLeon et al., 2013, after Millenson, 1963). The chance that a reinforcer has been set up grows as time passes without a response.',
 prog:'Each minute, flip a coin (RI 2 min) or roll a die (RI 6 min); if it comes up, the next response is reinforced.',
 prod:'As for VI, with no terminal acceleration because the probability per cycle never changes.',
 used:'Where a prepared interval list is impractical; a quick way to make attention unpredictable.',
 pit:'As for RR: long unpaid stretches by chance; cap them while the student is learning.',
 ex:'At each minute mark the aide rolls a die; on a 1 the next on-task moment earns a point.',refs:['deleon13']},
{id:'lh',fam:'basic',name:'Limited hold',abbr:'LH',nota:'VI 60 s LH 5 s',one:'A reinforcer set up by the schedule is cancelled unless a response occurs within a window.',
 def:'A modifier added to interval schedules, not a schedule on its own: once the interval has elapsed, the reinforcer is available only for t seconds, then withdrawn until the next interval (Catania, 2007; Ferster &amp; Skinner, 1957).',
 prog:'Add a window to any interval schedule: &ldquo;when the opportunity opens you have 10 seconds to respond.&rdquo;',
 prod:'Raises the rate under interval schedules, since a pause now costs reinforcers; a very short hold approaches extinction.',
 used:'Latency contingencies (respond within t of the opportunity); mand opportunities that close; the limited-hold comparison in schedule-thinning work (Hanley et al., 2001).',
 pit:'A hold shorter than the student&rsquo;s response latency; staff who extend the window informally and thereby remove it.',
 ex:'When the teacher says &ldquo;who can tell me,&rdquo; a hand raised within 5 seconds is called on; later hands are not.',refs:['catania07','fs57','hanley01']},
{id:'pr',fam:'basic',name:'Progressive ratio (and progressive interval, progressive delay)',abbr:'PR',nota:'PR step 2 (1, 3, 5, 7 &hellip;)',one:'The response requirement grows after each reinforcer until responding stops; the last ratio completed is the breakpoint.',
 def:'A ratio that increases arithmetically or geometrically across successive reinforcers (Hodos, 1961). Catania (2007) lists the general case, a progressive schedule, as one in which &ldquo;some schedule parameter changes systematically over successive reinforcers&rdquo;; progressive-interval and progressive-delay arrangements change the interval or the delay instead.',
 prog:'Set the first ratio and the step; after each reinforcer raise the requirement; end the session when no response occurs for a set time (the break criterion); record the breakpoint.',
 prod:'Runs of growing length separated by growing pauses, then a stop. The breakpoint rises with reinforcer value and magnitude, which is what makes the schedule an assessment tool.',
 used:'Comparing reinforcers under increasing work requirements, where two stimuli equally preferred at FR 1 separate as the price rises (Roane, Lerman &amp; Vorndran, 2001; DeLeon et al., 2014); progressive delays in delay fading after FCT (Hagopian, Boelter &amp; Jarmolowicz, 2011).',
 pit:'Used as a treatment rather than an assessment, an escalating requirement within a session is ratio strain by design; keep it as a measurement.',
 ex:'For two candidate rewards, the student works on PR 2 for each on separate days; the one with the higher breakpoint goes on the menu.',refs:['hodos61','catania07','roane01','deleon14','hagopian11']},
{id:'adj',fam:'basic',name:'Adjusting schedule',abbr:'adj',nota:'adj FR (n &plusmn; k after each reinforcer)',one:'The requirement is changed after each reinforcer as a function of the performance that just preceded it.',
 def:'&ldquo;The value of the interval or ratio is changed in some systematic way after reinforcement as a function of the immediately preceding performance&rdquo; (Ferster &amp; Skinner, 1957, Chapter 2); in an interlocking schedule the change happens between reinforcements, in an adjusting schedule after them.',
 prog:'State the rule in advance: raise the ratio by one after a run completed without a long pause; lower it after a pause longer than t. Percentile schedules (below) are the modern applied form; the changing-criterion design (Hartmann &amp; Hall, 1976) is its evaluation.',
 prod:'A requirement that tracks the learner&rsquo;s current performance and so avoids both strain and stagnation.',
 used:'Goal stepping in point systems and self-monitoring (Form SM-1); shaping with percentile criteria (Galbicka, 1994).',
 pit:'A rule that is not written is a mood; adjustments made on a bad day teach the student that pauses lower the price.',
 ex:'The number of problems required for a break rises by one each day the previous requirement was met in under 10 minutes.',refs:['fs57','hartmann76','galbicka94']},
{id:'other',fam:'basic',name:'Other laboratory arrangements: interpolated, superimposed and yoked',abbr:'interpol',nota:'FI 10 with an interpolated block of FR 50',one:'Arrangements used to analyze schedules rather than to treat; useful to know when reading the literature.',
 def:'Interpolated: a small block of reinforcements on one schedule is inserted into a background of another without a stimulus change (Ferster &amp; Skinner, 1957). Superimposed: a second schedule, often response-independent, is laid over the first to weaken or strengthen a contingency (DeLeon et al., 2013). Yoked: one organism&rsquo;s reinforcers are delivered whenever another&rsquo;s performance earns them, which separates reinforcement rate from the response&ndash;reinforcer relation (Ferster &amp; Skinner, 1957, Chapter 3).',
 prog:'Not programmed as treatment. The yoked control is the logic behind comparing a response-dependent schedule with an NCR schedule that delivers the same number of reinforcers.',
 prod:'An interpolated block changes the performance that follows it for a while; a superimposed free reinforcer lowers the rate maintained by the contingent one.',
 used:'The comparison of DRO and NCR with matched reinforcement rates (Vollmer et al., 1993) is a yoking argument in applied form.',
 pit:'Reading a treatment effect from a change in reinforcement rate alone, when the contingency also changed.',
 ex:'A week of dense praise inserted into a lean term is an interpolated block; expect the lean weeks after it to look different for a while.',refs:['fs57','deleon13','vollmer93']},
/* ---- time-based ---- */
{id:'ft',fam:'time',name:'Fixed time',abbr:'FT',nota:'FT t',one:'The stimulus is delivered every t seconds regardless of behavior.',
 def:'A response-independent delivery of a stimulus that functions as a reinforcer in other contexts. Strictly it is not a reinforcement schedule, since nothing is contingent on responding (DeLeon et al., 2013).',
 prog:'Set a timer; deliver at each interval whatever the student is doing, unless a brief omission rule is written in.',
 prod:'Abolishes the motivation for behavior that produces the same stimulus; may produce accidental (&ldquo;superstitious&rdquo;) strengthening of whatever happens to precede delivery (Skinner, 1948).',
 used:'The basis of noncontingent reinforcement (below); scheduled attention, scheduled breaks, scheduled access to a preferred item.',
 pit:'Delivery that coincides with problem behavior reinforces it by accident (Vollmer, Ringdahl, Roane &amp; Marcus, 1997).',
 ex:'A two-minute break every 10 minutes of the work period, by the clock.',refs:['deleon13','skinner48','vollmer97']},
{id:'vt',fam:'time',name:'Variable time',abbr:'VT',nota:'VT t',one:'Deliveries come at irregular times averaging t, regardless of behavior.',
 def:'The variable form of FT: the time between deliveries varies around a mean (Catania, 2007).',
 prog:'A vibrating timer set to a mean with a range, cueing the adult to deliver; or a shuffled interval list.',
 prod:'As for FT, without a pattern the student can learn.',
 used:'Teachers&rsquo; praise timers: in Bulla and Frieder (2017) the teachers wore a timer on VT 3 minutes (1 to 6) and praised and gave tokens to the students following expectations at each vibration, which turned VT into an intermittent reinforcement schedule for the class.',
 pit:'As for FT.',
 ex:'The aide&rsquo;s timer vibrates on average every 4 minutes; at each vibration every student who is working gets a mark.',refs:['catania07','bulla17']},
{id:'ncr',fam:'time',name:'Noncontingent reinforcement',abbr:'NCR',nota:'FT 10 s + EXT, thinned to FT 5 min',one:'The functional reinforcer is delivered on a time schedule, usually with extinction, so the behavior no longer has to produce it.',
 def:'Time-based delivery of the reinforcer identified by assessment, almost always with extinction of the problem behavior. Vollmer, Iwata, Zarcone, Smith and Mazaleski (1993) showed it as effective as DRO for attention-maintained self-injury and easier to run; Carr, Severtson and Lepper (2009) rated it empirically supported.',
 prog:'Start dense: at or below the baseline mean time between responses (Vollmer et al., 1993 began at the mean inter-response time). Thin by fixed increments or on a performance criterion; Kahng, Iwata, DeLeon and Wallace (2000) compared the two and both reached a terminal schedule with low rates. Dense schedules worked where lean ones did not (Hagopian, Fisher &amp; Legacy, 1994). Add a brief omission rule (delay the delivery a few seconds if the behavior just occurred) to avoid accidental reinforcement (Vollmer et al., 1997).',
 prod:'Rapid reduction through two mechanisms: the motivating operation is abolished and the response&ndash;reinforcer relation is broken.',
 used:'Attention-, escape- and tangible-maintained behavior; automatic reinforcement with matched stimuli delivered freely.',
 pit:'It teaches no replacement; it competes with FCT if both run at once; satiation lowers the value of the reinforcer for the alternative response; thinning too fast re-establishes the motivation.',
 ex:'The teacher gives 20 seconds of attention every 2 minutes during seatwork, moving to every 5 minutes over three weeks as the data allow.',refs:['vollmer93','carr09','kahng00','hagopian94','vollmer97']},
/* ---- differential reinforcement ---- */
{id:'dro',fam:'dr',name:'Differential reinforcement of other behavior',abbr:'DRO',nota:'DRO 30 s (whole-interval, resetting)',one:'The reinforcer is delivered when the target behavior has not occurred for an interval, or is absent at the moment the interval ends.',
 def:'Reinforcement contingent on the absence of a response for t seconds (Catania, 2007). Variants: whole-interval (interval) DRO, in which the behavior must be absent throughout; momentary DRO, in which it must be absent at the instant the interval ends (Repp, Barton &amp; Brulle, 1983); fixed or variable intervals (Lindberg, Iwata, Kahng &amp; DeLeon, 1999); resetting, in which an occurrence restarts the timer, or non-resetting, in which the next scheduled interval simply goes unpaid. Catania&rsquo;s table notes that in effect it usually works as a negative-punishment arrangement for the designated response; Mazaleski et al. (1993) found that for attention-maintained self-injury the extinction component carried most of the effect.',
 prog:'Set the first interval at or below the baseline mean time between responses (Poling &amp; Ryan, 1982; Vollmer &amp; Iwata, 1992); deliver the reinforcer at each interval that passes without the behavior; lengthen the interval on a written criterion. Whole-interval DRO to establish the reduction; momentary or variable-momentary DRO to maintain it when continuous observation is impossible (Repp et al., 1983; Lindberg et al., 1999).',
 prod:'A reduction in the target behavior proportional to how much of the reinforcement it loses; whatever else is happening at the end of intervals is strengthened, which is the schedule&rsquo;s name and its weakness.',
 used:'Reviewed across dozens of applications by Vollmer and Iwata (1992); compared with NCR (Vollmer et al., 1993) and with DRI (Tarpley &amp; Schroeder, 1979).',
 pit:'Intervals longer than the baseline inter-response time never pay; resetting intervals with high-rate behavior make the reinforcer unattainable; the &ldquo;other&rdquo; behavior paid at interval end may be another problem behavior; it teaches nothing in particular, so pair it with DRA.',
 ex:'Each 2 minutes without a scream earns a token; after three days at 80% of intervals earned, the interval becomes 3 minutes.',refs:['catania07','repp83','lindberg99','mazaleski93','poling82','vollmeriwata92','vollmer93','tarpley79']},
{id:'drl',fam:'dr',name:'Differential reinforcement of low rates',abbr:'DRL',nota:'DRL IRT &gt; 20 s &middot; full-session DRL &le; 3 per class',one:'Reinforcement for responding slowly, or for keeping the count under a limit.',
 def:'In the laboratory form, a response is reinforced only if at least t seconds have passed since the previous response (Ferster &amp; Skinner, 1957: a timer reset by each response). Deitz and Repp (1973) and Deitz (1977) defined the applied forms: full-session DRL, in which the reinforcer is delivered if the total for the session is at or below a limit; interval DRL, in which each interval with at most n responses is reinforced; and spaced-responding DRL, the laboratory form, in which a response is reinforced only after an inter-response time longer than t.',
 prog:'Set the first limit near the baseline mean so the student can meet it, then lower it in steps (differential reinforcement of diminishing rates); for spaced responding, set the IRT criterion just above the baseline mean IRT and lengthen it.',
 prod:'A low, steady rate that is remarkably durable, because slower responding produces reinforcers more often (DeLeon et al., 2013).',
 used:'Talk-outs and off-task remarks (Deitz &amp; Repp, 1973); requests for teacher attention reduced but not eliminated (Austin &amp; Bevan, 2011); rapid eating slowed with spaced-responding DRL (Lennox, Miltenberger &amp; Donnelly, 1987; Wright &amp; Vollmer, 2002).',
 pit:'Full-session DRL pays the target behavior as long as it stays under the limit, so it is wrong for behavior that must be zero; a limit set below what the student can do is extinction with a name.',
 ex:'Up to three questions per period earns the end-of-period point; next week, two.',refs:['fs57','deitz73','deitz77','deleon13','austin11','lennox87','wright02']},
{id:'drd',fam:'dr',name:'Differential reinforcement of diminishing rates',abbr:'DRD',nota:'DRD: &le; 5, then &le; 3, then &le; 1 per period',one:'Interval or full-session DRL with limits lowered step by step.',
 def:'A DRL arrangement in which the criterion is reduced across phases as performance meets it; the term is used in applied texts (Cooper, Heron &amp; Heward, 2020) for the gradual form Deitz and Repp (1973) demonstrated.',
 prog:'Write the sequence of limits and the criterion for stepping down (for example, two consecutive days under the limit); keep the reinforcer the same at each step.',
 prod:'A gradual reduction without the burst that a sudden zero criterion invites.',
 used:'Classroom behavior that is acceptable at low rates; the changing-criterion design evaluates it (Hartmann &amp; Hall, 1976).',
 pit:'Steps too large; stepping down on the calendar rather than the data.',
 ex:'Out-of-seat: fewer than 6 earns the point this week, fewer than 4 next week, fewer than 2 the week after.',refs:['cooper20','deitz73','hartmann76']},
{id:'drh',fam:'dr',name:'Differential reinforcement of high rates',abbr:'DRH',nota:'DRH &ge; 10 per minute &middot; IRT &lt; t',one:'Reinforcement only for responding at or above a rate.',
 def:'A response is reinforced if it occurs within t seconds of the last, or if at least n responses occur within t seconds (Catania, 2007). Ferster and Skinner (1957, Chapter 3) warn that reinforcing single fast pairs selects a vibrating topography and recommend measuring the rate over several responses.',
 prog:'Define the unit (items per minute over a timed block, not two quick responses); pay the block that meets the rate; raise the rate in small steps from a baseline the student already meets sometimes.',
 prod:'High rates while the contingency holds; hard to maintain, because when responding slows the reinforcers stop and nothing pulls the rate back (DeLeon et al., 2013).',
 used:'Pace of self-feeding (Girolami, Kahng, Hilker &amp; Girolami, 2009); fluency building, where a range-bound rate goal with self-monitoring of pace raised math fluency (Farrell &amp; McDougall, 2008); the increasing interlocking sheet in Form SM-1.',
 pit:'Speed bought with accuracy; a rate criterion set above what the student can do becomes extinction; the ceiling of the task.',
 ex:'A 3-minute math sprint of 30 or more correct digits earns the token; the bar moves up by 3 when it is met on three days.',refs:['catania07','fs57','deleon13','girolami09','farrell08']},
{id:'drp',fam:'dr',name:'Differential reinforcement of paced responding',abbr:'DRP',nota:'DRP: IRT between 5 and 15 s',one:'Reinforcement only for responses that fall inside a band of inter-response times.',
 def:'A response is reinforced if it occurs between t and t&prime; seconds after the last one; the schedule &ldquo;sets both upper and lower limits on response rates that can be reinforced&rdquo; (Catania, 2007, in DeLeon et al., 2013).',
 prog:'Define the band from baseline: the lower limit slows a rushed response, the upper limit prevents stalling. A metronome, a timer with two tones, or a self-monitoring sheet with a pace line can mark the band.',
 prod:'A rate held inside the band; the two limits make it stable where DRL and DRH alone drift.',
 used:'Eating pace, speaking rate, work pace in vocational tasks; pacing in precision teaching practice.',
 pit:'A band too narrow for the student&rsquo;s variability; measuring single IRTs where a block average would be fairer.',
 ex:'One bite every 10 to 20 seconds, cued by a timer, earns the end-of-meal choice.',refs:['catania07','deleon13','cooper20']},
{id:'dra',fam:'dr',name:'Differential reinforcement of alternative behavior',abbr:'DRA',nota:'DRA: FR 1 for [alternative] + EXT for [target]',one:'A specified alternative response is reinforced while the target response is extinguished.',
 def:'Reinforcement of members of one response class and extinction of responses outside it (DeLeon et al., 2013); in function-based treatment, the alternative produces the same reinforcer the target behavior produced (Vollmer &amp; Iwata, 1992). Functional communication training is DRA with a communication response as the alternative.',
 prog:'Choose an alternative that is easier than the target and already in the repertoire or quickly taught; reinforce it every time at first; extinguish the target; thin on a schedule. When extinction cannot be implemented, make reinforcement for the alternative denser, better in quality, or less delayed than for the target (Vollmer, Roane, Ringdahl &amp; Marcus, 1999; Athens &amp; Vollmer, 2010).',
 prod:'The alternative rises and the target falls in proportion to how reinforcement shifts between them; the matching law predicts the allocation.',
 used:'Across the problem-behavior literature; the treatment-challenge analyses of Vollmer et al. (1999) and Athens and Vollmer (2010) show which parameters carry it when extinction is imperfect.',
 pit:'An alternative that takes more effort or pays later than the target; thinning that outruns the data and produces resurgence; forgetting that a dense DRA schedule also raises the persistence of whatever else is reinforced in that context (Mace et al., 2010).',
 ex:'Tapping the help card earns teacher help within 10 seconds; shouting earns nothing.',refs:['deleon13','vollmeriwata92','vollmer99','athens10','mace10']},
{id:'dri',fam:'dr',name:'Differential reinforcement of incompatible behavior',abbr:'DRI',nota:'DRI: hands in lap (incompatible with hand-mouthing)',one:'DRA in which the alternative cannot physically occur at the same time as the target.',
 def:'A special case of DRA: the reinforced response is topographically incompatible with the target, so reinforcing one necessarily excludes the other (Vollmer &amp; Iwata, 1992).',
 prog:'Pick the incompatible response; reinforce it on a schedule that starts dense; measure both responses.',
 prod:'Suppression that can be faster than DRO because the paid response occupies the target&rsquo;s time (Tarpley &amp; Schroeder, 1979, compared the two for self-injury and reported an advantage for DRI).',
 used:'Self-injury, hand-mouthing, out-of-seat (sitting is incompatible with standing).',
 pit:'An incompatible response that is not reinforced by anything natural will not survive thinning; an arbitrary incompatible response may be unrelated to the function.',
 ex:'Holding the squeeze ball with both hands during circle earns praise every 30 seconds.',refs:['vollmeriwata92','tarpley79']},
{id:'fct',fam:'dr',name:'Functional communication training',abbr:'FCT (DRC)',nota:'FCT: FR 1 for FCR + EXT &rarr; thinning',one:'DRA in which the alternative is a communication response that produces the functional reinforcer.',
 def:'Carr and Durand (1985) taught children to request the reinforcer their problem behavior had produced; Tiger, Hanley and Bruzek (2008) give the practical guide. The functional communication response (FCR) is reinforced continuously at first, the problem behavior is placed on extinction, and the schedule is then thinned.',
 prog:'Pick an FCR that is low effort, easy to recognize and acceptable in every setting; teach it with prompts in the situation that evokes the problem behavior; honor every instance; thin with a signaled multiple schedule, a chained schedule or delay fading (see the applied entries). Hagopian et al. (1998): FCT with extinction reduced problem behavior by 90% or more in most cases, FCT without extinction rarely did, and some cases needed punishment added.',
 prod:'A new response that replaces the old one on the same reinforcer; durable when the thinning is signaled and gradual.',
 used:'The most widely replicated function-based treatment; Greer et al. (2016) analyzed 25 applications of thinning after FCT.',
 pit:'An FCR that is honored only sometimes without a signal (a mixed schedule); an FCR the student emits at a rate nobody can honor; thinning by delay alone, which often fails (Hagopian et al., 2011).',
 ex:'&ldquo;Break please&rdquo; earns a 1-minute break every time for a week; then only when the green card is up.',refs:['carr85','tiger08','hagopian98','greer16','hagopian11']},
{id:'dnr',fam:'dr',name:'Differential negative reinforcement',abbr:'DNRA / DNRO',nota:'DNRA: a break for compliance + escape extinction',one:'Escape or avoidance delivered for the alternative (or for the absence of the target) while escape for the target is blocked.',
 def:'The negative-reinforcement forms of DRA and DRO: a break follows compliance or a request (DNRA), or follows an interval without problem behavior (DNRO), and problem behavior no longer ends the demand (Vollmer &amp; Iwata, 1992; Marcus &amp; Vollmer, 1995).',
 prog:'Keep the demand in place through problem behavior (escape extinction); deliver the break for the alternative on a dense schedule; thin by raising the work before the break.',
 prod:'Compliance rises and disruption falls when escape is the function; the break itself becomes the reinforcer for working.',
 used:'Escape-maintained disruption and self-injury in instructional settings; FCT for escape is DNRA with a break request.',
 pit:'Breaks for the alternative that are shorter or later than the escape the behavior used to buy; demands kept in place without the skill to meet them.',
 ex:'Finishing three problems earns a 2-minute break; refusing does not end the problems.',refs:['vollmeriwata92','marcus95']},
{id:'lag',fam:'dr',name:'Lag schedules (differential reinforcement of variability)',abbr:'Lag n',nota:'Lag 1 &middot; Lag 3',one:'A response is reinforced only if it differs from the previous n responses.',
 def:'Variability is an operant (Page &amp; Neuringer, 1985): a response is reinforced if it differs from the last n responses in the sequence. Lag 1 requires difference from the immediately preceding response; Lag 3 from the last three.',
 prog:'Define what counts as different (a new word, a different activity, a different form); keep a list of the last n; reinforce only novel entries; pair with DRA so that only appropriate variants pay.',
 prod:'More varied responding; with small lags, the learner may cycle through n + 1 responses in order, which satisfies the schedule without novelty.',
 used:'Varied verbal responses in autism (Lee, McComas &amp; Jawor, 2002); varied activity selection in a classroom (Cammilleri &amp; Hanley, 2005).',
 pit:'Paying any different response, including wrong ones; a lag larger than the repertoire.',
 ex:'A different answer to &ldquo;what do you like to do?&rdquo; than the last three given earns the token.',refs:['page85','lee02','cammilleri05']},
{id:'pct',fam:'dr',name:'Percentile schedules (shaping)',abbr:'percentile',nota:'reinforce if better than the median of the last 10',one:'The criterion for reinforcement is set at a percentile of the learner&rsquo;s own recent responses.',
 def:'Galbicka (1994) formalized shaping: a response is reinforced if it exceeds the kth percentile of the last m responses, so the criterion tracks the learner and the probability of reinforcement stays constant. It is an adjusting schedule with the rule made explicit.',
 prog:'Choose the window (the last 10 responses) and the percentile (the median pays about half); measure each response on the shaped dimension (duration of engagement, number of words); reinforce those that beat the criterion.',
 prod:'Steady improvement without strain, because the criterion never jumps beyond what the learner has just done.',
 used:'Shaping academic engagement duration with percentile criteria in a classroom (Athens, Vollmer &amp; St. Peter Pipkin, 2007).',
 pit:'A dimension that is hard to measure quickly; windows so short that the criterion swings.',
 ex:'Each time the student stays on the task longer than the median of their last ten tries, the timer stops with praise and a point.',refs:['galbicka94','athens07']},
/* ---- compound and complex ---- */
{id:'mult',fam:'compound',name:'Multiple schedule',abbr:'mult',nota:'mult FR 1 EXT (green card / red card)',one:'Two or more schedules alternate, each signaled by its own stimulus.',
 def:'&ldquo;Reinforcement is programmed by two or more schedules alternating usually at random. Each schedule is accompanied by a different stimulus, which is present as long as the schedule is in force&rdquo; (Ferster &amp; Skinner, 1957, Chapter 2).',
 prog:'Pair each component with a salient stimulus (a colored card, a lanyard, a timer face); run the components for set durations; never honor a response in the wrong component. In FCT thinning, the reinforcement component (S+) is shortened and the extinction component (S&minus;) lengthened step by step (Hanley, Iwata &amp; Thompson, 2001; Fisher, Greer, Fuhrman &amp; Querim, 2015; Greer et al., 2016; reviewed by Saini, Miller &amp; Fisher, 2016).',
 prod:'Discriminated performance: the response occurs under S+ and not under S&minus;. Behavioral contrast (Reynolds, 1961): when one component is extinguished, the rate in the unchanged component can rise.',
 used:'Schedule thinning after FCT; bringing mands under stimulus control in preschool (Tiger &amp; Hanley, 2004); any &ldquo;available / not available&rdquo; signal.',
 pit:'Signals that are not salient or are not used consistently; S&minus; stretched faster than the data allow; contrast effects in the other setting.',
 ex:'When the green card is up a break request earns a break; when the red card is up it does not, and the card times are stepped from 60 s/0 s to 60 s/240 s.',refs:['fs57','hanley01','fisher15','greer16','saini16','reynolds61','tiger04']},
{id:'mix',fam:'compound',name:'Mixed schedule',abbr:'mix',nota:'mix FR 1 EXT',one:'Two or more schedules alternate with no stimulus to tell them apart.',
 def:'&ldquo;Similar to multiple except that no stimuli are correlated with the schedules&rdquo; (Ferster &amp; Skinner, 1957).',
 prog:'Rarely programmed on purpose. It is what a signaled schedule becomes when the signals are dropped, and what an FCR faces when staff honor it on some occasions and not others with nothing to mark which.',
 prod:'Performance governed by the recent history rather than by current conditions; more responding in the unpaid component than under a multiple schedule.',
 used:'As the comparison condition that shows why signals matter: Hanley et al. (2001) found thinning under a multiple schedule more effective than the same thinning without signals.',
 pit:'Every unsignaled &ldquo;not now&rdquo; is a mixed-schedule component; the student keeps responding in it because responding sometimes pays.',
 ex:'The same break request, honored or not depending on the teacher&rsquo;s moment, with no card: avoid.',refs:['fs57','hanley01']},
{id:'chain',fam:'compound',name:'Chained schedule',abbr:'chain',nota:'chain FR 3 FR 1 (tasks, then the request works)',one:'Completing the first schedule produces a stimulus in whose presence the second schedule operates and ends in the reinforcer.',
 def:'&ldquo;Similar to tandem schedules except that a conspicuous change in stimuli occurs upon completion of the first component&hellip; The second stimulus eventually controls the performance appropriate to the second schedule, and, as a conditioned reinforcer, reinforces a response to the first stimulus&rdquo; (Ferster &amp; Skinner, 1957, Chapter 2; Kelleher, 1966).',
 prog:'In FCT thinning for escape: a number of tasks must be completed (first link, FR n) before the signal appears that the break request will be honored (second link); the number of tasks is raised stepwise (Lalli, Casey &amp; Kates, 1995; Hanley, Jin, Vanselow &amp; Hanratty, 2014). In teaching, task analyses chained forward or backward use the same logic: each link&rsquo;s completion stimulus is a conditioned reinforcer for the link before it.',
 prod:'Responding in the first link is maintained by the conditioned reinforcer; long first links weaken, which is why chains are built from the end.',
 used:'Demand fading within FCT; vocational and self-care chains.',
 pit:'A first link lengthened before the second-link stimulus has become a reinforcer; a signal that is not distinct.',
 ex:'After three problems the teacher shows the green card; now &ldquo;break please&rdquo; works.',refs:['fs57','kelleher66','lalli95','hanley14']},
{id:'tand',fam:'compound',name:'Tandem schedule',abbr:'tand',nota:'tand FR 1 FI 10 s',one:'Two schedules in sequence with no stimulus change between them.',
 def:'&ldquo;A single reinforcement is programmed by two schedules, the second of which begins when the first has been completed, with no correlated change in stimuli&rdquo; (Ferster &amp; Skinner, 1957). Ferster and Skinner note that tand FR 1 FI, the interval timed only after a single response, &ldquo;has a marked effect in opposing the development of a pause after reinforcement.&rdquo;',
 prog:'Mostly analytic. In applied form, &ldquo;do three tasks and then the next request works, with no signal,&rdquo; is a tandem arrangement and inferior to its chained twin.',
 prod:'Performance reflects the combined requirement without the stimulus support a chain provides.',
 used:'The comparison that shows what the chained stimulus adds.',
 pit:'Expecting a student to count links nobody has marked.',
 ex:'Avoid; add the signal and it becomes a chain.',refs:['fs57']},
{id:'conc',fam:'compound',name:'Concurrent schedules',abbr:'conc',nota:'conc VI 30 s VI 120 s',one:'Two or more schedules operate at the same time for two or more responses; the learner chooses.',
 def:'&ldquo;A operates for one response; B operates for another response&rdquo; (Catania, 2007). The matching law (Herrnstein, 1961; Baum, 1974) describes the result: the share of behavior on each alternative tends to match its share of reinforcement, with bias and undermatching as the common deviations.',
 prog:'Every DRA is a concurrent schedule: the target and the alternative compete for the student&rsquo;s time. Rate, quality, delay and effort of reinforcement on each side decide the allocation (Neef, Mace, Shea &amp; Shade, 1992; Athens &amp; Vollmer, 2010), so the alternative must win on those dimensions.',
 prod:'Choice proportional to relative reinforcement; sensitivity to the parameters above.',
 used:'Problem behavior analyzed with the matching law (Borrero &amp; Vollmer, 2002); academic time allocation (Neef et al., 1992); concurrent-operant reinforcer assessment (DeLeon et al., 2014); reviewed by Fisher and Mazur (1997).',
 pit:'Designing one side of a concurrent schedule as if the other did not exist.',
 ex:'Help card: help within 10 seconds, every time. Shouting: nothing. Reading the two lines together is the design.',refs:['catania07','herrnstein61','baum74','neef92','athens10','borrero02','deleon14','fisher97']},
{id:'conjt',fam:'compound',name:'Conjoint schedules',abbr:'conjt',nota:'conjt VI 60 s (attention) FR 1 (escape)',one:'Two schedules operate at the same time, independently, for a single response.',
 def:'&ldquo;A and B operate at the same time but independently for a single response (as with concurrent schedules but without different responses)&rdquo; (Catania, 2007).',
 prog:'Not usually programmed. It is the schedule a multiply controlled behavior is on: the same response produces attention on one schedule and escape on another, which is why synthesized contingencies are analyzed and treated together (Hanley et al., 2014).',
 prod:'Responding maintained by the combined reinforcement; removing one source may leave the response intact.',
 used:'An analytic label for behavior with more than one function.',
 pit:'Treating one function and expecting the behavior to stop.',
 ex:'Screaming that ends the task and brings the aide: two schedules for one response, both to be addressed.',refs:['catania07','hanley14']},
{id:'alt',fam:'compound',name:'Alternative schedule',abbr:'alt',nota:'alt FR 10 FI 5 min',one:'The reinforcer is delivered when either a ratio or an interval requirement is met, whichever comes first.',
 def:'&ldquo;Reinforcement is programmed by either a ratio or an interval schedule, whichever is satisfied first&rdquo; (Ferster &amp; Skinner, 1957).',
 prog:'State both requirements and pay the first met: ten problems or five minutes of working, whichever comes first, earns the break.',
 prod:'A guaranteed minimum rate of reinforcement for a slow worker and a bonus for a fast one; responding under the ratio component dominates when the student can meet it.',
 used:'Informal demand fading and work periods where the slow student would otherwise never reach the reinforcer.',
 pit:'An interval so short the ratio never matters; pacing that waits for the clock.',
 ex:'Ten problems, or five minutes on task, earns the break.',refs:['fs57']},
{id:'conj',fam:'compound',name:'Conjunctive schedule',abbr:'conj',nota:'conj FR 10 FI 5 min',one:'The reinforcer requires both a ratio and an interval to be satisfied.',
 def:'&ldquo;Reinforcement occurs when both a ratio and an interval schedule have been satisfied&rdquo; (Ferster &amp; Skinner, 1957); Herrnstein and Morse (1958) analyzed it.',
 prog:'State both: at least five minutes and at least ten problems. Most classroom rules are conjunctive without saying so (&ldquo;stay for the period and finish the sheet&rdquo;).',
 prod:'Pauses followed by bursts when the interval is long relative to the ratio; the ratio can be completed early and then nothing pays until the time is up.',
 used:'Work periods with a time floor; token exchange rules that require both a count and a day.',
 pit:'A time floor that makes early finishing pointless; combine with something to do in the waiting time.',
 ex:'The period must be over and ten problems done before the break.',refs:['fs57','herrnsteinmorse58']},
{id:'interlock',fam:'compound',name:'Interlocking schedule',abbr:'interlock',nota:'interlock FR 20 &rarr; 6 over 15 min',one:'The number of responses required changes with the time elapsed since the last reinforcer.',
 def:'&ldquo;The organism is reinforced upon completion of a number of responses; but this number changes during the interval which follows the previous reinforcement&rdquo; (Ferster &amp; Skinner, 1957, Chapter 2). Their example sets the requirement at 300 and reduces it linearly to 1 over 10 minutes. Catania (2007): the reinforcer depends on &ldquo;some combined function&rdquo; of responses and time. Berryman and Nevin (1962) ran a continuum from FR 36 to FI 2 minutes through interlocking schedules; Powers (1968) compared clock-delivered reinforcers in conjunctive and interlocking schedules.',
 prog:'Write the requirement at each minute; decreasing (requirement falls with time: protects quality, prevents strain) or increasing (requirement rises with time: builds pace). Form SM-1 prints the school&rsquo;s session sheet of this kind.',
 prod:'A performance between the ratio and interval patterns, shifting along the continuum as the requirement&rsquo;s time dependence changes.',
 used:'The Royal Palm self-monitoring session sheet; fluency work where the price of pace is written out.',
 pit:'A decreasing requirement that reaches one before the work is done, which pays waiting; an increasing one that outruns the student.',
 ex:'Twenty items earns the break at minute 0; eighteen at minute 2; down to six at minute 14.',refs:['fs57','catania07','berryman62','powers68']},
{id:'second',fam:'compound',name:'Second-order schedules',abbr:'second order',nota:'FI 5 min (FR 10) &middot; token economy: FR 5 (tokens) / FR 10 (exchange)',one:'Completing a component schedule is treated as a unit response that is itself reinforced on another schedule.',
 def:'&ldquo;Completing A is reinforced according to B&rdquo; (Catania, 2007): successive fixed ratios, for instance, are the units an interval schedule reinforces. A brief stimulus at the completion of each unit maintains the pattern (Kelleher, 1966). Token economies are second-order schedules: a token-production schedule, an exchange-production schedule and an exchange schedule (Hackenberg, 2009, 2018).',
 prog:'Specify the unit (what earns one token), the exchange-production schedule (how many tokens buy an exchange) and the exchange schedule (when exchange can happen); mark unit completion with the token itself.',
 prod:'Patterns at two levels: the within-unit pattern of the component and the between-exchange pattern of the higher-order schedule. Raising the exchange ratio too far can dramatically reduce responding (Bullock &amp; Hackenberg, 2006, in DeLeon et al., 2013).',
 used:'Every token economy; point sheets with an end-of-day exchange (Form SM-1).',
 pit:'Changing two of the three schedules at once; an exchange schedule so lean the token stops functioning.',
 ex:'Five correct answers earn a token (FR 5); ten tokens buy the exchange (FR 10); exchange happens at 2:30 (FI, by the clock).',refs:['catania07','kelleher66','hackenberg09','hackenberg18','deleon13']},
{id:'concchain',fam:'compound',name:'Concurrent-chains schedules',abbr:'conc chain',nota:'initial links VI 30 s VI 30 s; terminal links A and B',one:'Two concurrently available initial links lead to different terminal links; choice in the initial links measures preference for the terminal arrangements.',
 def:'A choice procedure: responses on either of two initial-link schedules produce access to that side&rsquo;s terminal link, which ends in the reinforcer under its own conditions. The initial-link allocation indexes preference for the terminal links (Fisher &amp; Mazur, 1997).',
 prog:'Present two colored cards or doors; selecting one leads to that arrangement for the next period; count the selections across sessions.',
 prod:'A measure of preference between whole arrangements, not single items.',
 used:'Client preference for function-based treatment packages (Hanley, Piazza, Fisher, Contrucci &amp; Maglieri, 1997); the value of choice itself (Tiger, Hanley &amp; Hernandez, 2006); preference for accumulated over distributed reinforcement (DeLeon et al., 2014).',
 pit:'Terminal links that differ in more than one way; too few selections to read.',
 ex:'Blue door: work then five minutes free at the end. Yellow door: one minute free after each page. Which the student picks, over ten days, decides the arrangement.',refs:['fisher97','hanley97','tiger06','deleon14']},
/* ---- applied arrangements ---- */
{id:'token',fam:'applied',name:'Token economy',abbr:'token',nota:'FR 5 (token) &middot; FR 10 (exchange) &middot; exchange at 2:30',one:'Conditioned reinforcers earned on one schedule, exchanged on another for back-up reinforcers.',
 def:'A second-order schedule in which tokens bridge the time between behavior and the back-up reinforcer. Ivy, Meindl, Overley and Robson (2017) name six procedural parts: the target responses, the token, the back-ups, and the token-production, exchange-production and exchange schedules. Hackenberg (2018) reviews the translational evidence.',
 prog:'Write all six parts; start with a dense production schedule and a small exchange requirement; thin the production schedule or raise the exchange requirement one at a time; keep the exchange reliable. Tokens lose value with delay more slowly than consumables (Charlton &amp; Fantino, 2008, in DeLeon et al., 2013) and resist satiation when they buy several things (DeLeon et al., 2014).',
 prod:'Behavior maintained like behavior maintained by money; token loss acts as a punisher (Raiff, Bullock &amp; Hackenberg, 2008, in DeLeon et al., 2013).',
 used:'Classrooms, residential programs, point sheets, self-monitoring systems (Form SM-1).',
 pit:'Exchange skipped or delayed; prices raised faster than earnings; response cost added to a system designed as reinforcement; back-ups available free elsewhere.',
 ex:'See Form SM-1; this form&rsquo;s Design page writes the three schedules and the price of each back-up.',refs:['ivy17','hackenberg18','deleon13','deleon14']},
{id:'thin',fam:'applied',name:'Schedule thinning after FCT or DRA',abbr:'thinning',nota:'mult: 60 s S+ / 0 &rarr; 60 s S+ / 240 s S&minus;',one:'Moving from continuous reinforcement of the alternative to a schedule the setting can sustain, without losing the treatment effect.',
 def:'Hagopian, Boelter and Jarmolowicz (2011) review the methods: delay fading (progressively longer waits), signaled multiple schedules (Hanley et al., 2001; Fisher et al., 2015), chained schedules with demand fading (Lalli et al., 1995), response restriction (the FCR materials removed between opportunities; Roane, Fisher, Sgro, Falcomata &amp; Pabico, 2004), and dense-to-lean DRA (Vollmer et al., 1999). Greer et al. (2016) analyzed 25 applications of multiple-schedule thinning and the additions (alternative reinforcers, punishment) needed when problem behavior re-emerged.',
 prog:'Pick the method by function and setting; write the step sequence and the criterion for each step (for example, problem behavior at or below a set percentage of baseline for two consecutive sessions, and the FCR occurring in S+ and not in S&minus;); write the step-back rule; give the student something to do during S&minus; (competing items; Hagopian, Contrucci Kuhn, Long &amp; Rush, 2005). Terminal arrangements of about one minute available to four minutes unavailable are typical of the Fisher laboratory&rsquo;s applications (Greer et al., 2016).',
 prod:'Gradual transfer to a practical schedule with the discrimination intact; problem behavior that returns at a step signals the step was too large.',
 used:'The end of every FCT and DRA program that is to leave the clinic.',
 pit:'Delay fading alone; steps on the calendar; no signal; nothing to do while waiting.',
 ex:'The Design page builds the step table from the start and terminal values.',refs:['hagopian11','hanley01','fisher15','lalli95','roane04','vollmer99','greer16','hagopian05']},
{id:'delay',fam:'applied',name:'Delayed reinforcement and delay fading',abbr:'delay',nota:'FR 1 with a signaled 30-s delay',one:'A reinforcer that follows the response after a delay, and the procedures that stretch the delay.',
 def:'Lattal (2010) reviews the basic work: unsignaled delays weaken responding steeply; signaled delays, in which a stimulus bridges the gap, sustain far more; delayed reinforcers also strengthen the responses that preceded the reinforced one, so an error just before a paid response is paid too (DeLeon et al., 2013). Within some range, delays of about 30 seconds maintain responding in humans and nonhumans.',
 prog:'Signal the delay (&ldquo;okay, in a minute&rdquo;), give the student an activity or a token during it, and lengthen it in small steps on a criterion; teach a tolerance response for the denial (Hanley et al., 2014).',
 prod:'Behavior that survives a wait; discounting of value with delay that is shallower for tokens than for consumables.',
 used:'Delay-and-denial tolerance training; delay fading after FCT, which succeeds mainly when combined with signals, competing stimuli or chained work requirements (Hagopian et al., 2005, 2011).',
 pit:'Unsignaled delays; delays stretched before the signal has meaning; delays filled with nothing.',
 ex:'&ldquo;Not yet, when the timer rings&rdquo;: the timer runs 10 s this week, 30 s next week, 2 min in a month, and the puzzle is on the desk while it runs.',refs:['lattal10','deleon13','hanley14','hagopian05','hagopian11']},
{id:'momentum',fam:'applied',name:'Resistance to change (behavioral momentum)',abbr:'momentum',nota:'resistance &prop; reinforcement rate in the context',one:'How hard a behavior is to disrupt depends on the rate of reinforcement in its context, not only on its own rate.',
 def:'Nevin and Grace (2000): response rate and resistance to change are separate properties; resistance grows with the total reinforcement obtained in a stimulus context, whatever response produced it. Mace et al. (1990) demonstrated it in a natural setting.',
 prog:'A design consideration rather than a schedule: dense DRA or NCR in the same context as the problem behavior raises the persistence of the problem behavior too, which shows up when the alternative is later thinned (Mace et al., 2010). Deliver alternative reinforcement in a distinct context where possible, and expect resurgence at thinning.',
 prod:'Persistence proportional to reinforcement in the context; the trade-off between a low rate now and a durable reduction later.',
 used:'The explanation for resurgence during thinning; the rationale for teaching in new contexts and for lean schedules at the end.',
 pit:'Reading a low rate as a weak behavior.',
 ex:'The help card is taught and paid in a corner of the room with its own signal, not at the desk where shouting used to pay.',refs:['nevingrace00','mace90','mace10']}
];

/* ---------------- state ---------------- */
function blank(){return{meta:{},notes:{}};}
let S=blank();
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

/* ---------------- catalogue ---------------- */
let FAMSEL='all';
function catRow(th,td){return td?'<tr><th>'+th+'</th><td>'+td+'</td></tr>':'';}
function catCard(c,open){
  const refs=c.refs.map(k=>REFS[k]).join(' &bull; ');
  return '<details class="cat" data-id="'+c.id+'"'+(open?' open':'')+'><summary><b>'+c.name+'</b><span class="nota">'+c.nota+'</span><span class="fam fam-'+c.fam+'">'+FAM[c.fam]+'</span><span class="one">'+c.one+'</span></summary>'+
    '<div class="body"><table class="rt">'+catRow('Definition',c.def)+catRow('How it is programmed',c.prog)+catRow('What it produces',c.prod)+catRow('Where it has been used',c.used)+catRow('What goes wrong',c.pit)+catRow('In a school',c.ex)+
    '<tr><th>Our use of it</th><td><textarea data-note="'+c.id+'" rows="2" placeholder="where this program uses this schedule, with whom, and what the data showed">'+esc(S.notes[c.id]||'')+'</textarea></td></tr></table>'+
    '<div class="refs">'+refs+'</div></div></details>';
}
function renderCat(){
  const q=($('#catSearch').value||'').trim().toLowerCase();
  const openIds=new Set($$('#catOut details[open]').map(d=>d.dataset.id));
  const list=CAT.filter(c=>(FAMSEL==='all'||c.fam===FAMSEL)&&(!q||[c.name,c.abbr,c.nota,c.one,c.def,c.prog,c.prod,c.used,c.pit,c.ex].join(' ').toLowerCase().includes(q)));
  $('#catOut').innerHTML=list.map(c=>catCard(c,openIds.has(c.id)||(!!q&&list.length<=6))).join('')||'<p class="hint">Nothing in the catalogue matches that.</p>';
  $('#catCount').textContent=list.length+' of '+CAT.length+' schedules';
}
$('#famSeg').addEventListener('click',e=>{const b=e.target.closest('button[data-fam]');if(!b)return;FAMSEL=b.dataset.fam;$$('#famSeg button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderCat();});
$('#catSearch').addEventListener('input',renderCat);
$('#catOpen').addEventListener('click',()=>$$('#catOut details').forEach(d=>d.open=true));
$('#catClose').addEventListener('click',()=>$$('#catOut details').forEach(d=>d.open=false));
$('#catOut').addEventListener('input',e=>{const t=e.target.closest('textarea[data-note]');if(t)S.notes[t.dataset.note]=t.value;});
window.addEventListener('beforeprint',()=>{$$('#catOut details').forEach(d=>{d.dataset.was=d.open?'1':'';d.open=true;});});
window.addEventListener('afterprint',()=>{$$('#catOut details').forEach(d=>{d.open=d.dataset.was==='1';});});

/* ---------------- patterns: stylized cumulative records drawn by rule ---------------- */
function rng(seed){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
/* each generator returns {pts:[[t,n],...], rf:[[t,n],...]} over a fixed duration */
function genFR(R){const pts=[[0,0]],rf=[];let t=0,n=0;const N=20;while(t<300){t+=14+R()*8;for(let i=0;i<N;i++){t+=0.35+R()*0.15;n++;pts.push([t,n]);}rf.push([t,n]);}return{pts,rf};}
function genVR(R){const pts=[[0,0]],rf=[];let t=0,n=0,next=4+Math.floor(R()*30);while(t<300){t+=0.4+R()*0.25;n++;pts.push([t,n]);if(--next<=0){rf.push([t,n]);next=4+Math.floor(R()*30);t+=1.5;}}return{pts,rf};}
function genFI(R){const pts=[[0,0]],rf=[];let t=0,n=0;while(t<300){const start=t;let tt=t+15+R()*10;pts.push([tt,n]);while(tt<start+60){const frac=(tt-start)/60;tt+=0.4+5*(1-frac)*(1-frac);n++;pts.push([tt,n]);}t=tt;rf.push([t,n]);}return{pts,rf};}
function genVI(R){const pts=[[0,0]],rf=[];let t=0,n=0,next=t+5+R()*110;while(t<300){t+=1.4+R()*1.2;n++;pts.push([t,n]);if(t>=next){rf.push([t,n]);next=t+5+R()*110;}}return{pts,rf};}
function genEXTcrf(R){const pts=[[0,0]],rf=[];let t=0,n=0;for(let i=0;i<40;i++){t+=1.2+R()*0.6;n++;pts.push([t,n]);rf.push([t,n]);}let gap=0.6;while(t<300){t+=gap;n++;pts.push([t,n]);gap*=1.09+R()*0.04;}return{pts,rf};}
function genEXTvr(R){const pts=[[0,0]],rf=[];let t=0,n=0,next=4+Math.floor(R()*20);for(let i=0;i<60;i++){t+=0.9+R()*0.4;n++;pts.push([t,n]);if(--next<=0){rf.push([t,n]);next=4+Math.floor(R()*20);}}let run=25;while(t<300){for(let i=0;i<run&&t<300;i++){t+=0.9+R()*0.5;n++;pts.push([t,n]);}t+=6+R()*14;pts.push([t,n]);run=Math.max(3,Math.round(run*0.8));}return{pts,rf};}
function genDRL(R){const pts=[[0,0]],rf=[];let t=0,n=0;while(t<300){const irt=9+R()*9;t+=irt;n++;pts.push([t,n]);if(irt>=10)rf.push([t,n]);}return{pts,rf};}
function genDRH(R){const pts=[[0,0]],rf=[];let t=0,n=0;while(t<300){for(let i=0;i<12;i++){t+=0.3+R()*0.2;n++;pts.push([t,n]);}rf.push([t,n]);t+=3+R()*4;pts.push([t,n]);}return{pts,rf};}
function genPR(R){const pts=[[0,0]],rf=[];let t=0,n=0,req=2,pause=3;while(t<300&&pause<60){t+=pause;pts.push([t,n]);for(let i=0;i<req;i++){t+=0.4+R()*0.2;n++;pts.push([t,n]);}rf.push([t,n]);req+=3;pause*=1.45;}pts.push([300,n]);return{pts,rf};}
function genDRO(R){const pts=[[0,0]],rf=[];let t=0,n=0;/* the target behavior: dense at first, then sparse; marks are intervals earned */let gap=4;while(t<300){t+=gap;if(t>300)break;n++;pts.push([t,n]);gap=Math.min(70,gap*1.14+R()*2);}let k=30;while(k<300){const hit=pts.some(p=>p[0]>k-30&&p[0]<=k);if(!hit){const nn=pts.filter(p=>p[0]<=k).length;rf.push([k,nn]);}k+=30;}return{pts,rf,label:'target behavior'};}
const PATS=[
  {k:'fr',t:'Fixed ratio (FR 20)',g:genFR,p:'Break and run: a pause after each reinforcer, then a steep run to the next. The pause grows with the ratio; strain shows as pauses that swallow the runs.'},
  {k:'vr',t:'Variable ratio (VR 20)',g:genVR,p:'High and steady, with almost no pause: nothing about the count predicts the next reinforcer.'},
  {k:'fi',t:'Fixed interval (FI 60 s)',g:genFI,p:'The scallop: a pause, then acceleration into the reinforcer. The interval differentially reinforces responses that follow pauses.'},
  {k:'vi',t:'Variable interval (VI 60 s)',g:genVI,p:'Moderate and steady; reinforcers fall where they fall. The most stable of the basic patterns under changing conditions.'},
  {k:'extcrf',t:'Extinction after continuous reinforcement',g:genEXTcrf,p:'A burst at a higher rate than before, then a decline to nothing within the session.'},
  {k:'extvr',t:'Extinction after variable ratio',g:genEXTvr,p:'Runs at the old rate, separated by lengthening pauses; far more responding before it stops (the partial-reinforcement effect).'},
  {k:'drl',t:'Spaced-responding DRL (IRT > 10 s)',g:genDRL,p:'Single responses spaced at or beyond the criterion, most of them paid; a response too soon is simply unpaid.'},
  {k:'drh',t:'DRH (12 responses within 10 s)',g:genDRH,p:'Bursts that meet the rate, each paid, with short rests between; if the rate slips the reinforcers stop.'},
  {k:'pr',t:'Progressive ratio (step 3)',g:genPR,p:'Runs of growing length with pauses that grow faster, until the pause exceeds the break criterion: the breakpoint.'},
  {k:'dro',t:'DRO 30 s on a target behavior',g:genDRO,p:'Here the line is the behavior being reduced and each mark is an interval earned. Early intervals are lost; as the behavior spaces out, intervals pay.'}
];
function drawPat(d){
  const W=320,H=150,L=8,B=12,T=8,Rm=8;const tMax=300,nMax=Math.max(10,...d.pts.map(p=>p[1]));
  const X=t=>L+(W-L-Rm)*t/tMax,Y=n=>H-B-(H-B-T)*n/nMax;
  let s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="cumulative record"><line x1="'+L+'" y1="'+(H-B)+'" x2="'+(W-Rm)+'" y2="'+(H-B)+'" stroke="#9aa" stroke-width="1"/>';
  s+='<polyline fill="none" stroke="#2f5568" stroke-width="1.6" points="'+d.pts.map(p=>X(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1)).join(' ')+'"/>';
  d.rf.forEach(p=>{s+='<line x1="'+X(p[0]).toFixed(1)+'" y1="'+Y(p[1]).toFixed(1)+'" x2="'+(X(p[0])+5).toFixed(1)+'" y2="'+(Y(p[1])+7).toFixed(1)+'" stroke="#9B4E15" stroke-width="1.6"/>';});
  s+='<text x="'+(W-Rm)+'" y="'+(H-2)+'" font-size="8" text-anchor="end" fill="#5B6B6B" font-family="system-ui,sans-serif">time &rarr; (5 min)</text>';
  s+='<text x="'+(L+2)+'" y="'+(T+8)+'" font-size="8" fill="#5B6B6B" font-family="system-ui,sans-serif">'+(d.label||'responses')+' &uarr;</text></svg>';
  return s;
}
function renderPat(){$('#patOut').innerHTML=PATS.map((p,i)=>{const d=p.g(rng(11+i*7));return '<div class="pat">'+drawPat(d)+'<b>'+p.t+'</b><p>'+p.p+'</p></div>';}).join('');}

/* ---------------- chooser ---------------- */
function chooserRecs(){
  const m=S.meta,g=m.q_goal,f=m.q_func,w=m.q_who,fr=m.q_free,st=m.q_stage,ex=m.q_ext;if(!g)return null;
  const R=[];const add=(id,why,w)=>R.push({id,why,w:w||1});
  if(g==='acq'){add('crf','A new skill is acquired fastest when every correct response pays; thin once it is in the repertoire.',3);add('chain','A skill with steps is taught as a chain; each step&rsquo;s completion becomes the reinforcer for the step before.',2);add('pct','When the skill is a matter of degree (longer, faster, more), a percentile criterion shapes it without strain.',2);if(fr==='trial')add('vr','In trials, move from CRF to a small variable ratio of trials per reinforcer as accuracy holds.',1);}
  if(g==='inc'){add('dra','Reinforce the behavior you want on a dense schedule and let the competing behavior go unpaid: that is DRA, and it is a concurrent schedule.',3);add('vr','After CRF, a variable ratio keeps the rate high and the student unable to predict the next reinforcer.',2);add('token','If the reinforcer cannot follow at once, tokens bridge the delay and resist satiation.',2);if(w==='self')add('adj','A self-monitoring point sheet with stepped goals is an adjusting schedule; design it on Form SM-1.',2);if(w==='int')add('vi','An adult who checks in now and then should check at variable times; a VI series makes the checks unpredictable.',2);}
  if(g==='flu'){add('drh','Pay rate measured over a timed block, not single fast responses, and raise the rate in small steps.',3);add('interlock','An increasing interlocking requirement writes the price of pace minute by minute.',2);add('drp','When both too fast and too slow are problems, a paced-responding band holds the rate.',2);add('vr','Ratio schedules raise rate; interval schedules do not.',1);}
  if(g==='slow'){add('drl','Spaced-responding DRL pays only responses that follow a wait; full-session or interval DRL pays staying under a limit.',3);add('drp','A paced band sets a floor as well as a ceiling on the rate.',2);add('interlock','A decreasing interlocking requirement pays taking time, which protects quality and prevents strain.',2);}
  if(g==='red'){if(f==='esc'){add('dnr','Escape-maintained: the alternative (compliance or a break request) earns the break; the behavior no longer ends the demand.',3);add('fct','Teach a break request; honor it every time; thin with a chained schedule (tasks before the request works).',3);add('chain','Demand fading inside a chained schedule is the thinning method for escape.',2);}
    else{add('fct','Teach a request for the functional reinforcer; honor it every time; thin with signals.',3);add('dra','A function-based alternative, reinforced more densely and sooner than the problem behavior.',3);}
    if(f==='auto'){add('ncr','For automatic reinforcement, free access to matched stimulation competes with the behavior; pair with DRA for an appropriate way to get the same stimulation.',3);add('dro','A DRO interval set from the baseline IRT, with the matched stimulus as the reinforcer.',2);add('dri','An incompatible response that occupies the hands or the mouth.',2);}
    else{add('ncr','Time-based delivery of the functional reinforcer abolishes the motivation and is easy to run; it teaches nothing, so pair it with FCT or DRA.',2);add('dro','Reinforcement for intervals without the behavior; momentary or variable-momentary once the reduction is established, if nobody can watch continuously.',2);}
    if(ex==='no'||ex==='part')add('conc','Extinction cannot be run, so the alternative must win on the concurrent schedule: denser, better, sooner, easier than the problem behavior (Vollmer et al., 1999; Athens &amp; Vollmer, 2010).',3);
    if(ex==='yes')add('ext','The functional reinforcer withheld for every instance, with the burst planned for.',2);
    if(w==='int')add('dro','With intermittent observation use momentary or variable-momentary DRO.',1);}
  if(g==='redlow'){add('drl','Full-session or interval DRL pays the behavior staying under a limit; the limit is lowered in steps.',3);add('drd','Diminishing-rate steps written in advance, evaluated as a changing criterion.',2);add('dro','If the behavior should approach zero later, switch to DRO once the DRL limit is low.',1);}
  if(g==='maint'){add('thin','Thin on a plan: signaled multiple schedule for FCT, dense-to-lean for DRA, with criteria and a step-back rule.',3);add('mult','Signals tell the student when the schedule is on; without them the schedule is mixed and the behavior persists in the off periods.',2);add('vi','Variable schedules hold behavior steadily and resist extinction; move from FR to VR, from FI to VI.',2);add('dro','Momentary or variable-momentary DRO maintains a reduction with occasional checks.',1);add('token','Tokens on a thinned production schedule keep the exchange reliable while the behavior per token rises.',1);add('momentum','Expect the problem behavior to return at thinning in the context where it was richly reinforced; teach and pay the alternative in a distinct context.',1);}
  if(g==='wait'){add('delay','Signaled, filled, progressively longer delays; a tolerance response for the denial.',3);add('mult','An S&minus; signal that means not now, lengthened in steps, with something to do during it.',3);add('chain','Work before the request works: the number of tasks is the delay, and it is faded up.',2);add('token','A token during the wait is the signal that the reinforcer is coming.',2);}
  if(g==='var'){add('lag','A lag schedule pays only responses that differ from the last n; pair it with DRA so only appropriate variants pay.',3);add('pct','A percentile criterion on a novelty measure is another route.',1);}
  if(g==='assess'){add('pr','A progressive ratio separates reinforcers that look equal at FR 1; compare breakpoints.',3);add('conc','A concurrent-operant arrangement shows which of two reinforcers the student works for when both are available.',2);add('concchain','Concurrent chains measure preference between whole arrangements, including the student&rsquo;s preference for the treatment itself.',2);}
  if(st==='gen'&&g!=='maint')add('mult','For new settings, carry the signal with you: the schedule travels on its stimulus.',1);
  if(f==='multi')add('conjt','More than one function means the behavior is on a conjoint schedule; treat every function or the behavior stays.',2);
  const seen=new Set();return R.filter(r=>seen.has(r.id)?false:(seen.add(r.id),true)).sort((a,b)=>b.w-a.w);
}
function renderChoose(){
  const R=chooserRecs();const out=$('#chooseOut');
  if(!R){out.innerHTML='<p class="hint">Choose a goal to start.</p>';return;}
  out.innerHTML='<h3>Schedules to consider, strongest first</h3><table class="rt"><thead><tr><th style="width:26%">Schedule</th><th>Why</th><th style="width:18%">Notation</th></tr></thead><tbody>'+
    R.map(r=>{const c=CAT.find(x=>x.id===r.id);return '<tr><td><b>'+c.name+'</b> <span class="fam fam-'+c.fam+'">'+FAM[c.fam]+'</span><br><button type="button" class="linkbtn" data-open="'+c.id+'" style="font:inherit;font-size:11.5px;margin-top:3px">read the entry</button></td><td>'+r.why+'</td><td><span class="nota" style="font-family:ui-monospace,Menlo,monospace;font-size:12px">'+c.nota+'</span></td></tr>';}).join('')+'</tbody></table>'+
    '<p class="hint">Two reminders. A reduction schedule without a reinforced alternative leaves the function unmet (Vollmer &amp; Iwata, 1992). Any schedule that is thinned without signals and criteria becomes a mixed schedule the student cannot read (Hanley et al., 2001).</p>';
}
$('#chooseOut').addEventListener('click',e=>{const b=e.target.closest('button[data-open]');if(!b)return;FAMSEL='all';$$('#famSeg button').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.fam==='all')));$('#catSearch').value='';setView('catalog');renderCat();const d=$('#catOut details[data-id="'+b.dataset.open+'"]');if(d){d.open=true;d.scrollIntoView({block:'start'});}});

/* ---------------- designers ---------------- */
function fmtS(sec){if(sec==null)return '—';if(sec<180)return Math.round(sec)+' s';const m=sec/60;return (Math.round(m*10)/10)+' min';}
function fhSeries(T,N){const out=[];for(let n=1;n<=N;n++){const a=N-n,b=N-n+1;const la=a>0?a*Math.log(a):0;const v=T*(1+Math.log(N)+la-b*Math.log(b));out.push(Math.max(1,Math.round(v)));}return out;}
function shuffle(a,R){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function setDs(sel){document.body.className=document.body.className.replace(/\bds-\S+/g,'').trim()+(sel?' ds-'+sel:'');}
function tbl(head,rows){return '<table class="rt"><thead><tr>'+head.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table>';}
function nm(full,short,dflt){const s=(short||'').trim();if(s)return s;const f=(full||'').trim();if(!f)return dflt;const head=f.split(/[:(]/)[0].trim();return head.length>=3&&head.length<=60?head:dflt;}
function design(){
  const m=S.meta,sel=m.ds_sel;const B=esc(nm(m.beh,m.behs,'the behavior')),A=esc(nm(m.alt,m.alts,'the request')),R_=esc(nm(m.sr,m.srs,'the reinforcer'));if(!sel)return null;const o={id:sel,title:'',nota:'',rule:'',params:[],steps:null,stepsHead:null,data:[],warn:[],notes:''};
  const base=(nk,mk)=>{const n=num(m[nk]),mn=num(m[mk]);if(n==null||mn==null||n<=0||mn<=0)return null;return{n,mn,rate:n/mn,irt:mn*60/n};};
  if(sel==='dro'){
    const b=base('dro_n','dro_min'),share=(num(m.dro_share)??75)/100,step=(num(m.dro_step)??33)/100,term=(num(m.dro_term)??15)*60,type=m.dro_type||'whole',reset=m.dro_reset||'reset';
    o.title='DRO: differential reinforcement of other behavior';
    if(!b){o.warn.push('Enter the baseline count and minutes; the interval is set from the mean time between occurrences.');}
    else{let iv=Math.max(5,Math.floor(b.irt*share/5)*5);o.nota=(type==='whole'?'DRO ':type==='mom'?'momentary DRO ':'variable-momentary DRO ')+fmtS(iv)+(reset==='reset'?' (resetting)':' (non-resetting)');
      o.params.push(['Baseline rate',r1(b.rate)+' per minute'],['Baseline mean IRT',fmtS(b.irt)],['Starting interval',fmtS(iv)+' ('+Math.round(share*100)+'% of the mean IRT)'],['Type',type==='whole'?'Whole-interval: the behavior must be absent for the entire interval':type==='mom'?'Momentary: the behavior must be absent at the instant the interval ends':'Variable-momentary: checks at random times averaging the interval (range half to one and a half times)'],['Resetting',reset==='reset'?'An occurrence restarts the timer':'An occurrence loses that interval; the next starts on schedule']);
      const rows=[];let k=1,cur=iv;while(cur<term&&k<=12){rows.push([k,fmtS(cur),type==='vmom'?fmtS(cur*0.5)+' to '+fmtS(cur*1.5):'—',esc(m.dro_crit||'')]);cur=Math.round(cur*(1+step)/5)*5;k++;}rows.push([k,fmtS(term)+' (terminal)',type==='vmom'?fmtS(term*0.5)+' to '+fmtS(term*1.5):'—','hold']);
      o.stepsHead=['Step','Interval','Check times (variable-momentary)','Criterion to step up'];o.steps=rows;
      o.rule=(type==='whole'?'Start the timer. If '+B+' does not occur before it rings, deliver '+R_+' at once and restart. If it occurs, '+(reset==='reset'?'restart the timer immediately with no reinforcer.':'give nothing when the timer rings, and restart it then.'):type==='mom'?'Start the timer. When it rings, look: if '+B+' is not occurring at that moment, deliver '+R_+'; if it is, give nothing. Restart either way.':'Set the timer to random intervals averaging '+fmtS(iv)+'. At each ring, look: if '+B+' is not occurring at that moment, deliver '+R_+'; if it is, give nothing. Restart either way.');
      o.data=['Intervals run and intervals earned (percent earned per session)','Occurrences of '+B+' per session (rate against baseline '+r1(b.rate)+' per minute)','The interval in force each session'];
      if(share>1)o.warn.push('The starting interval is longer than the baseline mean IRT: most intervals will be lost at first and the reinforcer may never be contacted. Use 100% or less.');
      if(type==='whole'&&m.q_who==='int')o.warn.push('Whole-interval DRO needs continuous observation; with intermittent checks use momentary or variable-momentary DRO.');
      o.notes='Mazaleski et al. (1993) found the extinction component carried most of a DRO effect; make sure the reinforcer is also withheld for the behavior itself. Pair DRO with a reinforced alternative so the student learns what to do instead.';
      if(m.dro_back)o.params.push(['Step back when',esc(m.dro_back)]);}
  }
  if(sel==='drl'){
    const b=base('drl_n','drl_min'),sess=num(m.drl_sess)??(b?b.mn:50),variant=m.drl_var||'full',target=(num(m.drl_target)??20)/100,steps=Math.max(1,Math.min(10,num(m.drl_steps)??4)),ivl=num(m.drl_int)??10;
    o.title='DRL / DRD: differential reinforcement of low (and diminishing) rates';
    if(!b){o.warn.push('Enter the baseline count and minutes.');}
    else{const perSess=b.rate*sess;
      if(variant==='full'){const first=Math.floor(perSess),last=Math.max(0,Math.floor(perSess*target));o.nota='full-session DRL &le; '+first+' per '+sess+' min, stepping to &le; '+last;const rows=[];for(let k=0;k<=steps;k++){const lim=Math.round(first-(first-last)*k/steps);rows.push([k+1,'at most '+lim+' in the '+sess+'-minute session',esc(m.drl_crit||'')]);}o.stepsHead=['Step','Limit','Criterion to step down'];o.steps=rows;
        o.rule='Count every instance of '+B+' during the '+sess+'-minute session. If the total at the end is at or below the limit in force, deliver '+R_+'. If it is above, nothing is delivered and nothing is said.';
        o.params.push(['Baseline',r1(perSess)+' per '+sess+'-minute session ('+r1(b.rate)+' per minute)'],['First limit',first+' (at the baseline mean, so it is met about half the time at first)'],['Final limit',last+' ('+Math.round(target*100)+'% of baseline)']);
        o.data=['The count per session and the limit in force','Sessions at or under the limit (to apply the criterion)'];
        if(last===0)o.warn.push('The final limit is zero: at that point this is DRO, not DRL. Use DRO or DRA for a behavior that must stop.');}
      else if(variant==='interval'){const nInt=Math.max(1,Math.round(sess/ivl)),perInt=perSess/nInt;const first=Math.max(1,Math.floor(perInt)),last=Math.max(0,Math.floor(perInt*target));o.nota='interval DRL &le; '+first+' per '+ivl+' min';const rows=[];for(let k=0;k<=steps;k++){rows.push([k+1,'at most '+Math.round(first-(first-last)*k/steps)+' per '+ivl+'-minute interval',esc(m.drl_crit||'')]);}o.stepsHead=['Step','Limit per interval','Criterion to step down'];o.steps=rows;
        o.rule='Divide the session into '+ivl+'-minute intervals. Count '+B+' in each. At the end of each interval with a count at or under the limit, deliver '+R_+'; an interval over the limit earns nothing and the next starts fresh.';
        o.params.push(['Baseline per interval',r1(perInt)],['Intervals per session',nInt]);o.data=['Count per interval; intervals earned per session'];}
      else{const irt0=Math.max(2,Math.round(b.irt)),factor=Math.pow(1/target,1/steps);o.nota='DRL IRT &gt; '+irt0+' s, lengthening';const rows=[];let c=irt0;for(let k=0;k<=steps;k++){rows.push([k+1,'at least '+fmtS(Math.round(c))+' since the last response',esc(m.drl_crit||'')]);c*=factor;}o.stepsHead=['Step','Criterion IRT','Criterion to step'];o.steps=rows;
        o.rule='Time from each instance of '+B+'. An instance that comes at least the criterion time after the previous one is reinforced with '+R_+'; one that comes sooner is not, and the timer restarts from it.';
        o.params.push(['Baseline mean IRT',fmtS(b.irt)],['First criterion','the baseline mean, so about half of responses pay at first']);o.data=['Each IRT (or responses paid and unpaid per session)'];
        o.notes='Spaced-responding DRL is the form used for rapid eating (Lennox et al., 1987; Wright &amp; Vollmer, 2002). It pays the behavior, so it is for behavior that should continue at a slower pace.';}
    }
  }
  if(sel==='vi'){
    const kind=m.vi_kind||'vi',T=num(m.vi_mean),N=Math.max(2,Math.min(40,Math.round(num(m.vi_n)??10))),method=m.vi_method||'fh',R=rng(Math.round(num(m.vi_seed)??7)*7919);
    o.title='A series for a variable schedule';
    if(T==null||T<=0)o.warn.push('Enter the mean.');
    else{let ser;if(method==='fh')ser=shuffle(fhSeries(T,N),R);else if(method==='arith'){ser=[];for(let n=1;n<=N;n++)ser.push(Math.max(1,Math.round(2*T*n/(N+1))));ser=shuffle(ser,R);}else ser=null;
      const unit=kind==='vi'?' s':' responses';o.nota=(kind==='vi'?'VI ':'VR ')+Math.round(T)+(kind==='vi'?' s':'');
      if(ser){const mean=ser.reduce((a,b)=>a+b,0)/ser.length;o.params.push(['Series ('+(method==='fh'?'Fleshler–Hoffman':'arithmetic, shuffled')+')','<div class="series">'+ser.join(', ')+'</div>'],['Mean of the series',r1(mean)+unit],['Shortest / longest',Math.min(...ser)+' / '+Math.max(...ser)+unit]);
        o.rule=kind==='vi'?'Work through the series in order, one value per reinforcer: set the timer to the value; when it rings, the next instance of '+B+' earns '+R_+'; then set the next value. Start again at the top when the list is used up.':'Work through the series in order: count instances of '+B+'; the one that completes the current value earns '+R_+'; then take the next value.';
        o.data=['Reinforcers delivered per session and the obtained mean (reinforcers against time or responses)'];}
      else{const p=kind==='vi'?'each 10 seconds, with probability '+(10/T).toFixed(3):'each response, with probability '+(1/T).toFixed(3);o.nota=(kind==='vi'?'RI ':'RR ')+Math.round(T);o.params.push(['Random procedure','Sample '+p+'. A spinner, a die or a random-number app does it. The mean is '+Math.round(T)+unit+'; there is no longest value.']);
        o.rule=kind==='vi'?'Every 10 seconds, draw: if the draw hits, the next instance of '+B+' earns '+R_+'. Otherwise nothing changes.':'After each instance of '+B+', draw: a hit means that instance earns '+R_+'.';
        o.warn.push('Random schedules produce long unpaid stretches by chance; while the student is learning, cap them (pay the next response after '+Math.round(3*T)+(kind==='vi'?' s':' unpaid responses')+').');}
      o.notes='The Fleshler–Hoffman series keeps the chance of reinforcement nearly constant through the interval (Catania &amp; Reynolds, 1968); the arithmetic series makes reinforcement more likely late in the interval. Keep the shortest value short, which prevents a pause after reinforcement (Ferster &amp; Skinner, 1957, Chapter 6).';}
  }
  if(sel==='ncr'){
    const b=base('ncr_n','ncr_min'),kind=m.ncr_kind||'ft',dur=num(m.ncr_dur)??20,term=(num(m.ncr_term)??5)*60,omit=num(m.ncr_omit)??10;
    o.title='NCR: noncontingent reinforcement';
    if(!b)o.warn.push('Enter the baseline count and minutes.');
    else{let iv=Math.max(5,Math.floor(b.irt/5)*5);o.nota=(kind==='ft'?'FT ':'VT ')+fmtS(iv)+' ('+dur+' s access) + EXT';
      o.params.push(['Baseline mean IRT',fmtS(b.irt)],['Starting interval',fmtS(iv)+' (the baseline mean IRT, after Vollmer et al., 1993)'],['Each delivery',dur+' s of '+R_],['Omission rule','If '+B+' occurred in the last '+omit+' s, wait '+omit+' s of its absence before delivering'],['Thinning',m.ncr_thin==='perf'?'Performance-based: one step after each session at or under criterion; one step back after a session above it':'Fixed increments: one step each day the criterion holds']);
      const rows=[];let k=1,cur=iv;while(cur<term&&k<=12){rows.push([k,fmtS(cur),esc(m.ncr_crit||'')]);cur=Math.round(cur*2/5)*5;k++;}rows.push([k,fmtS(term)+' (terminal)','hold']);o.stepsHead=['Step','Interval','Criterion to step'];o.steps=rows;
      o.rule='Set the timer to '+fmtS(iv)+(kind==='vt'?' on average':'')+'. When it rings, deliver '+dur+' seconds of '+R_+' whatever the student is doing, unless '+B+' happened in the last '+omit+' seconds, in which case wait for '+omit+' seconds without it, then deliver. '+B+' itself never produces '+R_+'.';
      o.data=['Rate of '+B+' per session against baseline '+r1(b.rate)+' per minute','Deliveries per session and the interval in force'];
      o.notes='NCR teaches no replacement; run FCT or DRA alongside, and expect the free reinforcer to lower the value of the same reinforcer earned by the alternative (satiation). Dense schedules worked where lean ones did not (Hagopian et al., 1994).';}
  }
  if(sel==='pr'){
    const s0=Math.max(1,Math.round(num(m.pr_start)??1)),step=num(m.pr_step)??2,kind=m.pr_kind||'arith',brk=num(m.pr_break)??120;const items=(m.pr_items||'').split('\n').map(x=>x.trim()).filter(Boolean);
    o.title='Progressive ratio: comparing reinforcers under increasing requirements';const seq=[];let v=s0;for(let i=0;i<14;i++){seq.push(Math.round(v));v=kind==='geo'?v*step:v+step;}
    o.nota='PR '+(kind==='geo'?'&times;':'+')+step+' ('+seq.slice(0,6).join(', ')+' &hellip;)';
    o.params.push(['Sequence of ratios','<div class="series">'+seq.join(', ')+' &hellip;</div>'],['Break criterion',brk+' s without a response ends the session'],['Breakpoint','the last ratio completed before the break']);
    o.rule='Present '+B+'. The first '+s0+(s0===1?' response earns':' responses earn')+' the reinforcer; then the requirement '+(kind==='geo'?'multiplies by ':'rises by ')+step+' after each delivery. Stop when '+brk+' seconds pass with no response. Record the last ratio completed. Run each reinforcer on its own day; compare the breakpoints.';
    o.stepsHead=['Reinforcer','Session 1 breakpoint','Session 2 breakpoint','Session 3 breakpoint'];o.steps=(items.length?items:['(reinforcer 1)','(reinforcer 2)']).map(it=>[esc(it),'','','']);
    o.data=['Breakpoint per session per reinforcer; responses per minute within each ratio'];
    o.notes='PR schedules are an assessment (Hodos, 1961; Roane et al., 2001), not a treatment: an escalating requirement within a session is ratio strain by design.';
  }
  if(sel==='token'){
    const prodN=num((m.tk_prod||'').replace(/[^\d.]/g,''))??5,exch=num(m.tk_exch)??10;const backs=(m.tk_backs||'').split('\n').map(l=>{const p=l.split(',');return p.length>=2?{it:p.slice(0,-1).join(',').trim(),tk:num(p[p.length-1])}:null;}).filter(x=>x&&x.tk!=null);
    o.title='Token economy: a second-order schedule';o.nota='FR '+prodN+' (token) &middot; FR '+exch+' (exchange) &middot; exchange '+esc(m.tk_when||'at set times');
    o.params.push(['Token',esc(m.tk_what||'')],['Token production','FR '+prodN+': every '+prodN+' instance'+(prodN===1?'':'s')+' of '+B+' earns a token'],['Exchange production',exch+' tokens buy an exchange ('+(prodN*exch)+' responses)'],['Exchange schedule',esc(m.tk_when||'')],['Accumulation',esc(m.tk_acc||'')],['What is thinned first',esc(m.tk_thin||'')],['Loss',esc(m.tk_loss||'tokens are never taken away')]);
    if(backs.length){o.stepsHead=['Back-up','Tokens','Responses it costs','Exchanges needed'];o.steps=backs.map(b=>[esc(b.it),b.tk,b.tk*prodN,Math.ceil(b.tk/exch)]);}
    o.rule='Each time '+B+' occurs '+prodN+' time'+(prodN===1?'':'s')+', give one token at once with a word of praise. Tokens are exchanged '+(m.tk_when||'at the set times')+'; '+exch+' tokens buy an exchange. '+(m.tk_loss||'Tokens are never taken away.')+' Keep the exchange reliable: a missed exchange weakens every token.';
    o.data=['Tokens earned per session; exchanges made; back-ups chosen','The three schedules in force (only one changes at a time)'];
    if(exch*prodN>50)o.warn.push('The exchange costs '+(exch*prodN)+' responses. Large exchange requirements can sharply reduce responding (Bullock &amp; Hackenberg, 2006, in DeLeon et al., 2013); start smaller and raise one schedule at a time.');
    o.notes='Six parts (Ivy et al., 2017): the responses, the token, the back-ups, and the three schedules. Tokens bridge delay and resist satiation when they buy several things (DeLeon et al., 2014); token loss is a punisher (Raiff et al., 2008, in DeLeon et al., 2013).';
  }
  if(sel==='thin'){
    const pd=num(m.th_pdur)??60,m0=num(m.th_m0)??15,mT=num(m.th_mT)??240,mult=num(m.th_mult)??2;
    o.title='Multiple-schedule thinning after FCT';o.nota='mult FR 1 ('+esc(m.th_splus||'S+')+') EXT ('+esc(m.th_sminus||'S&minus;')+'): '+fmtS(pd)+' / '+fmtS(m0)+' &rarr; '+fmtS(pd)+' / '+fmtS(mT);
    const rows=[[1,fmtS(pd),'0 (continuous reinforcement, signal present)',esc(m.th_crit||'')]];let cur=m0,k=2;while(cur<mT&&k<=14){rows.push([k,fmtS(pd),fmtS(cur),esc(m.th_crit||'')]);cur=cur*(mult>1?mult:2);k++;}rows.push([k,fmtS(pd),fmtS(mT)+' (terminal)','hold']);o.stepsHead=['Step','S+ (request works)','S&minus; (request does not work)','Criterion to step'];o.steps=rows;
    o.params.push(['S+ signal',esc(m.th_splus||'')],['S&minus; signal',esc(m.th_sminus||'')],['During S&minus; the student has',esc(m.th_comp||'')],['Step back when',esc(m.th_back||'')]);
    o.rule='Show the S+ signal: every '+A+' is honored at once with '+R_+'. Show the S&minus; signal: a request is answered with a brief neutral &ldquo;not now&rdquo; and nothing else; '+B+' never produces '+R_+' under either signal. Alternate the signals for the durations in the step in force, starting each session in S+.';
    o.data=['Problem behavior per session against baseline (rate)','Requests under S+ and under S&minus; (the discrimination)','The step in force'];
    o.notes='Signaled thinning beat unsignaled in Hanley et al. (2001); Greer et al. (2016) analyzed 25 applications and the additions needed when problem behavior returned. Give the student something to do in S&minus; (Hagopian et al., 2005). Expect resurgence in the context where the problem behavior was richly reinforced (Mace et al., 2010).';
  }
  if(sel==='chain'){
    const s0=Math.max(0,Math.round(num(m.ch_start)??1)),sT=Math.round(num(m.ch_end)??10),st=Math.max(1,Math.round(num(m.ch_step)??1));
    o.title='Chained schedule with demand fading';o.nota='chain FR '+s0+' FR 1 &rarr; chain FR '+sT+' FR 1';
    const rows=[];let k=1;for(let v=s0;v<sT&&k<=20;v+=st,k++)rows.push([k,v+' '+(v===1?'task':'tasks')+', then '+esc(m.ch_sig||'the signal'),esc(m.ch_crit||'')]);rows.push([k,sT+' tasks (terminal)','hold']);o.stepsHead=['Step','Requirement before the request works','Criterion to step'];o.steps=rows;
    o.params.push(['A task is',esc(m.ch_task||'')],['Signal',esc(m.ch_sig||'')]);
    o.rule='Present the work. After the number of tasks in force, show '+(m.ch_sig||'the signal')+'; now '+A+' earns '+R_+' at once. Before the signal, a request is answered &ldquo;first the work, then you can ask&rdquo; and the work continues; '+B+' never ends the work.';
    o.data=['Tasks completed; requests before and after the signal; problem behavior per session'];
    o.notes='After Lalli, Casey and Kates (1995) and the chained-schedule treatments in Hanley et al. (2014). The signal is the conditioned reinforcer for the work; it must be taught before the requirement grows.';
  }
  if(sel==='interlock'){
    const dir=m.il_dir||'dec',init=num(m.il_init)??20,step=num(m.il_step)??2,every=Math.max(1,num(m.il_every)??2),len=Math.max(1,num(m.il_len)??16),floor=num(m.il_floor)??0,cap=num(m.il_cap)??init;
    o.title='Interlocking schedule';o.nota='interlock: '+init+' at minute 0, '+(dir==='dec'?'falling':'rising')+' by '+step+' every '+every+' min';
    const rows=[];for(let t=0;t<=len;t++){let req=init+(dir==='dec'?-1:1)*step*Math.floor(t/every);req=Math.max(floor,Math.min(cap,req));rows.push([t,req]);}o.stepsHead=['Minute','Items required'];o.steps=rows;
    o.rule='Start the timer when the student begins. The session ends with '+R_+' as soon as the number of items completed reaches the requirement for the current minute. '+(dir==='dec'?'The requirement falls as time passes, so careful work is never punished by the clock.':'The requirement rises as time passes, so pace pays.');
    o.data=['Minute of completion and items done; engagement checks per minute if used (Form SM-1 prints the sheet)'];
    o.notes='Ferster and Skinner (1957, Chapter 2) define the schedule; Berryman and Nevin (1962) ran the continuum. The decreasing form is the school&rsquo;s session sheet.';
  }
  if(sel==='lh'){const hold=num(m.lh_hold)??10;o.title='Interval schedule with a limited hold';o.nota=esc(m.lh_sched||'VI')+' LH '+hold+' s';
    o.params.push(['Interval schedule',esc(m.lh_sched||'')],['Hold',hold+' s'],['Opportunity signaled by',esc(m.lh_sig||'')]);
    o.rule='Run the interval schedule. When an interval elapses, signal the opportunity ('+(m.lh_sig||'')+'). If '+B+' occurs within '+hold+' seconds, deliver '+R_+'; if not, the opportunity closes and the next interval starts.';
    o.data=['Opportunities offered, taken within the hold, and missed'];o.notes='A hold shorter than the student&rsquo;s latency is extinction with a name; measure latency first.';}
  if(sel==='lag'){const n=Math.max(1,Math.round(num(m.lag_n)??1));o.title='Lag schedule';o.nota='Lag '+n;
    o.params.push(['Response class',esc(m.lag_class||'')],['Different means',esc(m.lag_diff||'')],['Never paid',esc(m.lag_never||'')]);
    o.rule='Keep a running list of the last '+n+' '+(m.lag_class||'responses')+'. A response that differs from all '+n+' earns '+R_+'; a repeat of any of them earns nothing. '+(m.lag_never?'Never pay: '+m.lag_never+'.':'');
    o.data=['Responses, whether novel, whether paid; the number of distinct responses per session'];o.notes='Lee, McComas and Jawor (2002); Cammilleri and Hanley (2005). With small lags the student may cycle through n + 1 responses; raise the lag or add a DRA criterion for quality.';}
  return o;
}
function renderDesign(){
  const o=design();const out=$('#dsOut');setDs(S.meta.ds_sel||'');
  if(!o){out.innerHTML='<p class="hint">Choose a schedule to design; the parameters appear above and the plan here.</p>';return;}
  let h='<h3>'+o.title+'</h3>';if(o.nota)h+='<div class="metric" style="margin:6px 0"><b>Notation</b><div class="val" style="font-family:ui-monospace,Menlo,monospace;font-size:16px">'+o.nota+'</div></div>';
  o.warn.forEach(w=>{h+='<div class="verdict v-mid">'+w+'</div>';});
  if(o.params.length)h+='<table class="rt">'+o.params.map(p=>'<tr><th style="width:28%">'+p[0]+'</th><td>'+p[1]+'</td></tr>').join('')+'</table>';
  if(o.steps)h+=tbl(o.stepsHead,o.steps);
  if(o.rule)h+='<p><b>The rule in words.</b> '+o.rule+'</p>';
  if(o.notes)h+='<p class="hint">'+o.notes+'</p>';
  out.innerHTML=h;
}

/* ---------------- the card ---------------- */
/* the workstation form that holds the schedule's data sheet, named when Data sheet used is left blank */
function sheetFor(o){if(o.id==='interlock')return 'Form SM-1 (the interlocking session sheet)';if(o.id==='dro'&&(S.meta.dro_type||'whole')!=='whole')return 'Form MT-1 (the momentary checks, as interval samples); Form DD-1 (occurrences per session)';if(o.id==='thin')return 'Form DD-1 (requests and problem behavior per session); Form MT-1 (the S+ and S&minus; periods, as interval samples)';return 'Form DD-1 (counts and intervals per session)';}
function renderCard(){
  const m=S.meta,o=design(),out=$('#cardOut');
  if(!o){out.innerHTML='<p class="hint">Design a schedule first; the card is written from it.</p>';return;}
  const bl='<span class="bl"></span>';
  let h='<div class="c-title">'+esc(m.cd_title||((m.client||'Student')+': '+o.title))+'</div><div class="c-nota">'+o.nota+'</div>'+
    '<div class="c-grid"><div><b>Student:</b> '+esc(m.client||'')+'</div><div><b>Setting:</b> '+esc(m.setting||'')+'</div><div><b>Run by:</b> '+esc(m.who||'')+'</div><div><b>Date:</b> '+esc(m.date||'')+'</div><div><b>Behavior:</b> '+esc(m.beh||'')+'</div>'+(m.alt?'<div><b>Replacement:</b> '+esc(m.alt)+'</div>':'')+'<div><b>Reinforcer:</b> '+esc(m.sr||'')+'</div>'+(m.func?'<div><b>Function:</b> '+esc(m.func)+'</div>':'')+'</div>';
  h+='<h3>The rule</h3><div class="rule">'+o.rule+'</div>';
  if(o.params.length)h+='<h3>Settings</h3><table class="ct">'+o.params.map(p=>'<tr><th style="width:30%">'+p[0]+'</th><td>'+p[1]+'</td></tr>').join('')+'</table>';
  if(o.steps){const dated=o.stepsHead[0]==='Step';/* a step table gets a Date reached column; the PR breakpoints, the token prices and the interlocking minutes do not */
    h+='<h3>'+(o.id==='pr'?'Breakpoints':o.id==='token'?'Back-ups':o.id==='interlock'?'Requirement by minute':'Steps')+'</h3><table class="ct"><tr>'+o.stepsHead.map(x=>'<th>'+x+'</th>').join('')+(dated?'<th style="width:14%">Date reached</th>':'')+'</tr>'+o.steps.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+(dated?'<td></td>':'')+'</tr>').join('')+'</table>';}
  h+='<h3>Data to keep</h3><ul>'+o.data.map(d=>'<li>'+d+'</li>').join('')+'<li>On: '+(m.cd_data?esc(m.cd_data):sheetFor(o))+'</li></ul>';
  h+='<h3>What never happens</h3><ul><li>'+esc(nm(m.beh,m.behs,'The behavior'))+' is never argued with, lectured about, or given the reinforcer by accident; if it happens, the rule above says exactly what to do.</li><li>The schedule is not changed by anyone during the day; steps are taken on the data, by the person named on the plan.</li><li>Nothing already earned is taken away.</li></ul>';
  if(o.warn.length)h+='<h3>Cautions</h3><ul>'+o.warn.map(w=>'<li>'+w+'</li>').join('')+'</ul>';
  h+='<div class="c-foot"><div>Step in force today: '+bl+' &nbsp; Initials: '+bl+'</div><div>Review: '+esc(m.cd_review||'')+' &nbsp; BCBA: '+esc(m.bcba||'')+'<br><span style="font-size:10.5px;color:#444">Form SR-1</span></div></div>';
  out.innerHTML=h;
}

/* ---------------- meta, render, toolbar ---------------- */
function bindMeta(){$$('[data-m]').forEach(el=>{el.value=S.meta[el.dataset.m]||'';});}
function renderAll(){bindMeta();renderCat();renderPat();renderChoose();renderDesign();renderCard();}
document.addEventListener('input',e=>{const el=e.target;if(el.dataset&&el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;if(/^q_/.test(el.dataset.m))renderChoose();else{renderDesign();renderCard();}}});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset&&el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;if(/^q_/.test(el.dataset.m))renderChoose();else{renderDesign();renderCard();}}});
$('#printBtn').addEventListener('click',()=>window.print());
$('#cardPrintBtn').addEventListener('click',()=>{if(!design()){alert('Design a schedule first; there is no card yet.');return;}
  document.body.classList.add('sr-card-only');const off=()=>{document.body.classList.remove('sr-card-only');window.removeEventListener('afterprint',off);};
  window.addEventListener('afterprint',off);setTimeout(()=>{window.print();setTimeout(off,1500);},30);});
$('#saveBtn').addEventListener('click',()=>{
  const nm=(S.meta.client||'student').replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'SR-1',rev:'2026-10',saved:new Date().toISOString(),S},null,1)],{type:'application/json'}));
  const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  a.download=`SR-1_${nm}_${ymd}.json`;document.body.appendChild(a);a.click();a.remove();});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
function fromFile(d){
  if(!d||typeof d!=='object'||d.form!=='SR-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v),obj=k=>s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])?s[k]:{};
  Object.keys(obj('meta')).forEach(k=>{o.meta[k]=str(s.meta[k]);});Object.keys(obj('notes')).forEach(k=>{if(CAT.some(c=>c.id===k))o.notes[k]=str(s.notes[k]);});
  return o;
}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='SR-1'?d.form:'';
    const next=other?null:fromFile(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved SR-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form SR-1. Nothing was changed.':'That file could not be read as a saved SR-1 form. Nothing was changed.');return;}
    const prev=S;S=next;try{renderAll();}catch(err){S=prev;renderAll();alert('That file could not be read as a saved SR-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});
$('#csvBtn').addEventListener('click',()=>{
  const q=v=>'"'+String(v==null?'':v).replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&rsquo;/g,'’').replace(/&ldquo;|&rdquo;/g,'"').replace(/&ndash;/g,'–').replace(/&mdash;/g,'—').replace(/&hellip;/g,'…').replace(/&minus;/g,'−').replace(/&rarr;/g,'→').replace(/&times;/g,'×').replace(/&le;/g,'≤').replace(/&ge;/g,'≥').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&plusmn;/g,'±').replace(/&prime;/g,'′').replace(/&prop;/g,'∝').replace(/&middot;/g,'·').replace(/&bull;/g,'•').replace(/"/g,'""')+'"';
  const rows=[['family','name','abbreviation','notation','one line','definition','how it is programmed','what it produces','where it has been used','what goes wrong','in a school','our use','references']];
  CAT.forEach(c=>rows.push([FAM[c.fam],c.name,c.abbr,c.nota,c.one,c.def,c.prog,c.prod,c.used,c.pit,c.ex,S.notes[c.id]||'',c.refs.map(k=>REFS[k]).join(' | ')]));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv'}));a.download='SR-1_schedules-of-reinforcement.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nThe student, the chooser answers, the design and the catalogue notes are all cleared.',{ok:'Clear all',danger:true})){S=blank();renderAll();}});
/* v21.44 (A1): the simulation asks first, with the question the other forms ask; it replaced the student, the chooser
   answers, the design and the catalogue notes without asking */
async function loadSim(){if(!(await nbhUI.confirm('Load the simulated case?\nThe student, the chooser answers, the design and the catalogue notes are filled with a worked example. Anything already entered will be replaced.',{ok:'Load'})))return;
  S=blank();Object.assign(S.meta,{client:'SIMULATED – Sample Student',sid:'000000',date:'2026-10-02',bcba:'J. Newsome, BCBA',plan:'BIP dated 8/5/26 (Form TD-1)',setting:'Resource room, independent work',who:'Ms. Lee (teacher); Mr. Ortiz (aide)',beh:'Calling out: any vocalization above conversational volume directed at the teacher without a raised hand',alt:'Raising a hand and waiting to be called on',sr:'Teacher attention: being called on within 10 s, with a comment on the answer',func:'Attention',behs:'calling out',alts:'a raised hand',srs:'being called on',
    q_goal:'red',q_free:'free',q_func:'att',q_who:'cont',q_stage:'start',q_ext:'yes',
    ds_sel:'dro',dro_n:'24',dro_min:'60',dro_type:'whole',dro_reset:'reset',dro_share:'75',dro_step:'33',dro_term:'15',dro_crit:'80% of intervals earned on 3 consecutive days',dro_back:'fewer than 50% earned on 2 days: return to the previous interval',
    drl_n:'30',drl_min:'50',drl_sess:'50',drl_var:'full',drl_int:'10',drl_target:'20',drl_steps:'4',drl_crit:'under the limit on 2 consecutive days',
    vi_kind:'vi',vi_mean:'180',vi_n:'10',vi_method:'fh',vi_seed:'7',ncr_n:'40',ncr_min:'60',ncr_kind:'ft',ncr_dur:'20',ncr_term:'5',ncr_thin:'fixed',ncr_omit:'10',ncr_crit:'at or under 10% of baseline rate',
    pr_start:'1',pr_step:'2',pr_kind:'arith',pr_break:'120',pr_items:'iPad, 30 s\npraise and a high five\ncracker',
    tk_prod:'FR 5',tk_what:'a laminated star on a velcro strip',tk_exch:'10',tk_when:'at 11:30 and 2:30',tk_acc:'Yes, saved for a larger back-up',tk_backs:'5 min free choice, 10\ncomputer time 10 min, 20\nlunch with a friend, 40',tk_thin:'Token production (more responses per token)',tk_loss:'tokens are never taken away',
    th_splus:'green card on the desk',th_sminus:'red card on the desk',th_pdur:'60',th_m0:'15',th_mT:'240',th_mult:'2',th_crit:'problem behavior at or under 10% of baseline and the request under S+ on 80% of opportunities, 2 consecutive sessions',th_back:'problem behavior above 20% of baseline for 2 sessions: previous step',th_comp:'a fidget from PA-1; a task at the student’s level',
    ch_sig:'green card',ch_start:'1',ch_end:'10',ch_step:'1',ch_crit:'no problem behavior and the request used appropriately in 2 consecutive sessions',ch_task:'one worksheet item',
    il_dir:'dec',il_init:'20',il_step:'2',il_every:'2',il_len:'16',il_floor:'6',il_cap:'20',lh_sched:'VI 120 s',lh_hold:'10',lh_sig:'the teacher looks up and says the student’s name',lag_n:'2',lag_class:'answers to “tell me about your weekend”',lag_diff:'a different activity named',lag_never:'off-topic or inappropriate answers',
    cd_title:'Sam’s calling-out schedule (DRO)',cd_data:'Form DD-1 (intervals run and earned per session; occurrences against baseline)',cd_review:'2026-10-16'});
  S.notes.dro='Used with Sam from 10/5; started at 2 min; at 3 min by 10/12.';S.notes.fct='Hand-raise FCR taught 9/28; honored every time in week 1.';renderAll();}
$('#simBtn').addEventListener('click',loadSim);
/* reference list */
$('#srRefs').insertAdjacentHTML('beforeend',Object.keys(REFS).sort((a,b)=>REFS[a].replace(/<[^>]+>/g,'').localeCompare(REFS[b].replace(/<[^>]+>/g,''))).map(k=>REFS[k]).join(' &bull;\n    '));
renderAll();

/* v21.31 the case: hooks. The schedule's behavior, its short name, the alternative response, the
   function and the reinforcer come from the case when their fields are empty; the picker replaces them. */
window.__nbhFactsIn=function(f){
  const m=S.meta;let n=0;const b=(f.behaviors||[])[0],a=((f.goals&&f.goals.acq)||[])[0];
  if(b){if(!m.beh){m.beh=nbhCase.line(b,true);n++;}if(!m.behs){m.behs=b.label;n++;}if(!m.alt&&b.rep){m.alt=b.rep;n++;}}
  const rp=(f.behaviors||[]).find(x=>x.isRep);
  if(!m.alt&&(a||rp)){m.alt=a?a.beh:rp.label;n++;}
  if(!m.func&&f.fn){const v=nbhCase.optionFor(document.querySelector('[data-m="func"]'),f.fn.key||f.fn.label);if(v){m.func=v;n++;}}
  if(!m.sr&&(f.menu||[]).length){m.sr=nbhCase.menuLine(f.menu,3)+' (Form PA-1)';n++;}
  if(n)renderAll();return {filled:n};
};
window.__nbhFactsPick=function(sel){
  const m=S.meta;let n=0;const b=sel.behaviors[0],a=sel.goals.acq[0];
  if(b){m.beh=nbhCase.line(b,true);m.behs=b.label;if(b.rep)m.alt=b.rep;n++;}
  if(a){m.alt=a.beh;n++;}
  if(sel.fn){const v=nbhCase.optionFor(document.querySelector('[data-m="func"]'),sel.fn.key||sel.fn.label);if(v){m.func=v;n++;}}
  if(sel.menu.length){m.sr=sel.menu.map(x=>x.name).join(', ')+' (Form PA-1)';m.srs=sel.menu[0].name;n++;}
  renderAll();return {filled:n};
};
