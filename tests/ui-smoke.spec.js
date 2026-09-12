const { test, expect } = require('@playwright/test');

const worlds = [
  ['Ruimtewereld','Ruimtewereld'],
  ['Dierenwereld','Dierenwereld'],
  ['Aardewereld','Aardewereld'],
  ['Geschiedeniswereld','Geschiedeniswereld'],
  ['Wetenschapwereld','Wetenschapwereld'],
  ['Mysteriewereld','Mysteriewereld']
];

async function boot(page){
  await page.route('**/*.mp4', route => route.abort());
  await page.addInitScript(() => {
    sessionStorage.setItem('kwizillo-intro-v4','1');
    localStorage.setItem('kwizillo-v4-state', JSON.stringify({
      coins:245,streak:7,level:5,xp:320,voice:'Stil',soundOn:false,musicOn:false,
      sfxVolume:.72,musicVolume:.24,musicTrack:'magical',timeLimitOn:true,timeLimit:45,
      group:5,answered:0,correct:0,quizzesPlayed:0,lastWorld:'ruimte'
    }));
  });
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Aardewereld'})).toBeVisible();
}

async function openWorld(page, buttonName){
  await page.getByRole('button',{name:buttonName}).click();
  const skip=page.getByRole('button',{name:'Overslaan'});
  if(await skip.isVisible().catch(()=>false)) await skip.click();
  await expect(page.locator('.native-world')).toBeVisible();
  await expect(page.locator('.world-topic')).toHaveCount(4);
  await expect(page.getByRole('button',{name:/Start gemengde quiz/})).toBeVisible();
}

test('all six world buttons open a real world screen, never a storyboard', async ({page})=>{
  await boot(page);
  for(const [buttonName,title] of worlds){
    await openWorld(page,buttonName);
    await expect(page.locator('.world-title-wrap h1')).toHaveText(title);
    if(buttonName==='Aardewereld'){
      await expect(page.locator('.native-world-bg')).toHaveAttribute('src','assets/world_earth_safe.svg');
      await expect(page.locator('.native-world-bg')).not.toHaveAttribute('src',/world_earth\.png/);
    }
    await page.getByRole('button',{name:'Terug naar home'}).click();
    await expect(page.getByRole('button',{name:'Aardewereld'})).toBeVisible();
  }
});

test('topic, hint, answer feedback and next-question flow are clickable', async ({page})=>{
  await boot(page);
  await openWorld(page,'Wetenschapwereld');
  await page.locator('.world-topic').first().click();
  await expect(page.locator('.quiz-shell')).toBeVisible();
  await expect(page.locator('.answer')).toHaveCount(4);
  await page.getByRole('button',{name:/Hint/}).click();
  await expect(page.locator('.hint-float')).toBeVisible();
  await page.getByRole('button',{name:'Hint sluiten'}).click();
  await expect(page.locator('.hint-float')).toHaveCount(0);
  await page.locator('.answer').first().click();
  await expect(page.locator('.feedback-float')).toBeVisible();
  await page.locator('#feedbackNext').click();
  await expect(page.locator('.quiz-shell')).toBeVisible();
  await expect(page.locator('.progress-panel')).toContainText('Vraag 2');
});

test('native world bottom navigation reaches every main destination', async ({page})=>{
  await boot(page);
  const destinations=[
    ['Prestaties','assets/achievements.png'],
    ['Collectie','assets/collection.png'],
    ['Statistieken','assets/stats.png'],
    ['Meer','assets/parent.png']
  ];
  for(const [name,asset] of destinations){
    await openWorld(page,'Aardewereld');
    await page.locator('.native-bottom-nav').getByRole('button',{name:new RegExp(name)}).click();
    await expect(page.locator('.master-art')).toHaveAttribute('src',asset);
    await page.getByRole('button',{name:'Home'}).click();
    await expect(page.getByRole('button',{name:'Aardewereld'})).toBeVisible();
  }
});

test('parent audio panel opens and controls can be operated', async ({page})=>{
  await boot(page);
  await page.getByRole('button',{name:'Meer / Ouderzone'}).click();
  await page.getByRole('button',{name:'Geluid & stem'}).click();
  await expect(page.locator('.sound-settings-overlay')).toBeVisible();
  await expect(page.locator('[data-toggle="sfx"]')).toBeVisible();
  await expect(page.locator('[data-toggle="music"]')).toBeVisible();
  await expect(page.locator('[data-guide="Milo"]')).toBeVisible();
  await expect(page.locator('[data-guide="Luna"]')).toBeVisible();
  await expect(page.locator('[data-guide="Stil"]')).toBeVisible();
  await page.getByRole('button',{name:'Sluiten'}).click();
  await expect(page.locator('.sound-settings-overlay')).toHaveCount(0);
});
