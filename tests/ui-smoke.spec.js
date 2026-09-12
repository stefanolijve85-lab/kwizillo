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
      group:5,answered:0,correct:0,quizzesPlayed:0,lastWorld:'ruimte',
      progress:{worlds:{},topics:{},correctQuestionIds:[]},selectedMascot:'milo'
    }));
  });
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Aardewereld'})).toBeVisible();
}

async function openWorld(page, buttonName){
  await page.getByRole('button',{name:buttonName}).click();
  const world=page.locator('.native-world');
  const skip=page.getByRole('button',{name:'Overslaan'});
  await Promise.race([
    world.waitFor({state:'visible',timeout:1800}),
    skip.waitFor({state:'visible',timeout:600}).then(()=>skip.click({timeout:600}).catch(()=>{})).catch(()=>{})
  ]).catch(()=>{});
  if(await skip.isVisible({timeout:150}).catch(()=>false)) await skip.click({timeout:300}).catch(()=>{});
  await expect(world).toBeVisible({timeout:5000});
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

test('every main navigation destination is dynamic and interactive', async ({page})=>{
  await boot(page);
  await openWorld(page,'Aardewereld');

  await page.locator('.native-bottom-nav').getByRole('button',{name:/Prestaties/}).click();
  await expect(page.locator('.achievement-grid')).toBeVisible();
  await expect(page.locator('.achievement-card')).toHaveCount(6);

  await page.locator('.native-bottom-nav').getByRole('button',{name:/Collectie/}).click();
  await expect(page.locator('.collection-tabs')).toBeVisible();
  await page.getByRole('button',{name:/Kaarten/}).click();
  await expect(page.locator('.empty-state,.knowledge-grid')).toBeVisible();
  await page.getByRole('button',{name:/Mascottes/}).click();
  await expect(page.locator('.mascot-card')).toHaveCount(6);
  await page.locator('.mascot-card:not([disabled])').first().click();

  await page.locator('.native-bottom-nav').getByRole('button',{name:/Statistieken/}).click();
  await expect(page.locator('.stat-hero')).toBeVisible();
  await expect(page.locator('.world-stat-list article')).toHaveCount(6);

  await page.locator('.native-bottom-nav').getByRole('button',{name:/Meer/}).click();
  await expect(page.locator('.settings-list')).toBeVisible();
});

test('parent controls and audio panel can all be operated', async ({page})=>{
  await boot(page);
  await page.getByRole('button',{name:'Meer / Ouderzone'}).click();
  await expect(page.locator('.parent-screen')).toBeVisible();
  await expect(page.getByText('Groep 5')).toBeVisible();
  await page.locator('[data-group="plus"]').click();
  await expect(page.getByText('Groep 6')).toBeVisible();
  await page.locator('#timeToggle').click();
  await expect(page.locator('#timeRange')).toBeDisabled();
  await page.locator('#soundOpen').click();
  await expect(page.locator('.sound-settings-overlay')).toBeVisible();
  await expect(page.locator('[data-toggle="sfx"]')).toBeVisible();
  await expect(page.locator('[data-toggle="music"]')).toBeVisible();
  await expect(page.locator('[data-guide="Milo"]')).toBeVisible();
  await expect(page.locator('[data-guide="Luna"]')).toBeVisible();
  await expect(page.locator('[data-guide="Stil"]')).toBeVisible();
  await page.getByRole('button',{name:'Sluiten'}).click();
  await page.locator('#privacyOpen').click();
  await expect(page.getByText('Privacy & veiligheid')).toBeVisible();
  await page.getByRole('button',{name:'Begrepen'}).click();
});

test('a complete 10-question quiz reaches result and result actions work', async ({page})=>{
  await boot(page);
  await openWorld(page,'Dierenwereld');
  await page.getByRole('button',{name:/Start gemengde quiz/}).click();
  for(let i=0;i<10;i++){
    await expect(page.locator('.quiz-shell')).toBeVisible();
    await expect(page.locator('.answer')).toHaveCount(4);
    await page.locator('.answer').first().click();
    await expect(page.locator('.feedback-float')).toBeVisible();
    await page.locator('#feedbackNext').click();
  }
  await expect(page.locator('.result-native')).toBeVisible();
  await expect(page.getByRole('button',{name:'Nog een quiz'})).toBeVisible();
  await page.getByRole('button',{name:'Naar mijn collectie'}).click();
  await expect(page.locator('.collection-screen')).toBeVisible();
  await expect(page.locator('.collection-tabs')).toBeVisible();
});
