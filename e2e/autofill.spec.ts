import {test,expect} from '@playwright/test';
import {db} from '../src/db/client';
const email=`autofill-${Date.now()}@example.test`;
const password='Local-autofill-test-2026';
test.afterAll(async()=>{await db.user.deleteMany({where:{email}});await db.$disconnect();});
test('mobile native autofill values survive rendering and submit without input events',async({page})=>{
 await page.setViewportSize({width:360,height:800});
 await page.goto('/');
 await page.getByRole('button',{name:'ابدأ رحلتك',exact:true}).click();
 const username=page.getByLabel('بريد ولي الأمر');const secret=page.getByLabel('كلمة المرور');
 await expect(username).toHaveAttribute('autocomplete','username');
 await expect(secret).toHaveAttribute('autocomplete','new-password');
 await expect(secret).toHaveAttribute('type','password');
 await page.evaluate(({email,password})=>{
  (document.querySelector('#register-username') as HTMLInputElement).value=email;
  (document.querySelector('#register-password') as HTMLInputElement).value=password;
 },{email,password});
 await page.getByRole('button',{name:'إنشاء حساب ولي الأمر',exact:true}).click();
 await expect(page.getByRole('heading',{name:'من ينضم إلى المغامرة؟'})).toBeVisible();
 await page.request.post('/api/auth/logout',{data:{}});await page.reload();
 await page.getByRole('button',{name:'دخول',exact:true}).click();
 await expect(page.getByLabel('كلمة المرور')).toHaveAttribute('autocomplete','current-password');
 await page.getByLabel('بريد ولي الأمر').fill(email);await page.getByLabel('كلمة المرور').fill(password);
 await page.getByRole('button',{name:'تسجيل الدخول',exact:true}).click();
 await expect(page.getByRole('heading',{name:'من ينضم إلى المغامرة؟'})).toBeVisible();
});
test('sound is opt-in and survives a reload',async({page})=>{
 await page.goto('/');const toggle=page.getByRole('button',{name:'صوت التشجيع',exact:true});
 await expect(toggle).toHaveAttribute('aria-pressed','false');await toggle.click();
 await expect(toggle).toHaveAttribute('aria-pressed','true');await page.reload();
 await expect(toggle).toHaveAttribute('aria-pressed','true');
});
