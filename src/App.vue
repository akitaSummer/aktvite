<template>
    <div class='test'>
        {{title}}
    </div>
</template>>

<script>
import { reactive, toRefs } from 'vue'

export default {
    setup() {
        const state = reactive({
            title: 'hello, aktvite'
        })

        return {
            ...toRefs(state)
        }
    }
}
</script>

<style>
.test {
    color: red;
}
</style>
